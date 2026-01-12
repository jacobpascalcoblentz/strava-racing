import {
  groupEffortsByUser,
  calculatePointsStandings,
  calculateTimeStandings,
  calculateStandings,
  formatTime,
  POINTS_TABLE,
  Effort,
} from "@/lib/leaderboard";

describe("lib/leaderboard", () => {
  describe("POINTS_TABLE", () => {
    it("should have correct point values", () => {
      expect(POINTS_TABLE).toEqual([10, 8, 6, 5, 4, 3, 2, 1, 1, 1]);
    });
  });

  describe("formatTime", () => {
    it("should format seconds to MM:SS", () => {
      expect(formatTime(0)).toBe("0:00");
      expect(formatTime(59)).toBe("0:59");
      expect(formatTime(60)).toBe("1:00");
      expect(formatTime(90)).toBe("1:30");
      expect(formatTime(125)).toBe("2:05");
      expect(formatTime(3661)).toBe("61:01");
    });
  });

  describe("groupEffortsByUser", () => {
    it("should group efforts by user", () => {
      const efforts: Effort[] = [
        { userId: "user-1", userName: "Alice", segmentId: "seg-1", elapsedTime: 100 },
        { userId: "user-2", userName: "Bob", segmentId: "seg-1", elapsedTime: 110 },
        { userId: "user-1", userName: "Alice", segmentId: "seg-2", elapsedTime: 200 },
      ];

      const result = groupEffortsByUser(efforts);

      expect(result.size).toBe(2);
      expect(result.get("user-1")?.userName).toBe("Alice");
      expect(result.get("user-1")?.times.get("seg-1")).toBe(100);
      expect(result.get("user-1")?.times.get("seg-2")).toBe(200);
      expect(result.get("user-2")?.times.get("seg-1")).toBe(110);
    });

    it("should keep only the best time per segment", () => {
      const efforts: Effort[] = [
        { userId: "user-1", userName: "Alice", segmentId: "seg-1", elapsedTime: 100 },
        { userId: "user-1", userName: "Alice", segmentId: "seg-1", elapsedTime: 90 }, // Better time
        { userId: "user-1", userName: "Alice", segmentId: "seg-1", elapsedTime: 110 }, // Worse time
      ];

      const result = groupEffortsByUser(efforts);

      expect(result.get("user-1")?.times.get("seg-1")).toBe(90);
    });

    it("should handle empty efforts", () => {
      const result = groupEffortsByUser([]);
      expect(result.size).toBe(0);
    });
  });

  describe("calculatePointsStandings", () => {
    it("should calculate points for single segment", () => {
      const userEfforts = new Map([
        ["user-1", { userName: "Alice", times: new Map([["seg-1", 100]]) }],
        ["user-2", { userName: "Bob", times: new Map([["seg-1", 90]]) }],
        ["user-3", { userName: "Charlie", times: new Map([["seg-1", 110]]) }],
      ]);

      const standings = calculatePointsStandings(userEfforts, ["seg-1"]);

      // Bob is 1st (90s), Alice is 2nd (100s), Charlie is 3rd (110s)
      expect(standings[0].userName).toBe("Bob");
      expect(standings[0].score).toBe(10); // 1st place
      expect(standings[1].userName).toBe("Alice");
      expect(standings[1].score).toBe(8); // 2nd place
      expect(standings[2].userName).toBe("Charlie");
      expect(standings[2].score).toBe(6); // 3rd place
    });

    it("should calculate points for multiple segments", () => {
      const userEfforts = new Map([
        ["user-1", { userName: "Alice", times: new Map([["seg-1", 100], ["seg-2", 200]]) }],
        ["user-2", { userName: "Bob", times: new Map([["seg-1", 90], ["seg-2", 250]]) }],
      ]);

      const standings = calculatePointsStandings(userEfforts, ["seg-1", "seg-2"]);

      // Segment 1: Bob=1st (10pts), Alice=2nd (8pts)
      // Segment 2: Alice=1st (10pts), Bob=2nd (8pts)
      // Total: Alice=18, Bob=18 (tie)
      expect(standings[0].score).toBe(18);
      expect(standings[1].score).toBe(18);
    });

    it("should award 0 points for positions beyond 10th", () => {
      const userEfforts = new Map(
        Array.from({ length: 12 }, (_, i) => [
          `user-${i}`,
          { userName: `User ${i}`, times: new Map([["seg-1", (i + 1) * 10]]) },
        ])
      );

      const standings = calculatePointsStandings(userEfforts, ["seg-1"]);

      expect(standings[10].score).toBe(0); // 11th place
      expect(standings[11].score).toBe(0); // 12th place
    });

    it("should handle users with partial segment completion", () => {
      const userEfforts = new Map([
        ["user-1", { userName: "Alice", times: new Map([["seg-1", 100], ["seg-2", 200]]) }],
        ["user-2", { userName: "Bob", times: new Map([["seg-1", 90]]) }], // Only seg-1
      ]);

      const standings = calculatePointsStandings(userEfforts, ["seg-1", "seg-2"]);

      // Segment 1: Bob=1st (10pts), Alice=2nd (8pts)
      // Segment 2: Alice=1st (10pts), Bob=0 (didn't complete)
      const alice = standings.find((s) => s.userName === "Alice")!;
      const bob = standings.find((s) => s.userName === "Bob")!;

      expect(alice.score).toBe(18); // 8 + 10
      expect(bob.score).toBe(10); // 10 + 0
    });
  });

  describe("calculateTimeStandings", () => {
    it("should sum times for all segments", () => {
      const userEfforts = new Map([
        ["user-1", { userName: "Alice", times: new Map([["seg-1", 100], ["seg-2", 200]]) }],
        ["user-2", { userName: "Bob", times: new Map([["seg-1", 90], ["seg-2", 250]]) }],
      ]);

      const standings = calculateTimeStandings(userEfforts, ["seg-1", "seg-2"]);

      expect(standings[0].userName).toBe("Alice");
      expect(standings[0].score).toBe(300); // 100 + 200
      expect(standings[1].userName).toBe("Bob");
      expect(standings[1].score).toBe(340); // 90 + 250
    });

    it("should exclude users who haven't completed all segments", () => {
      const userEfforts = new Map([
        ["user-1", { userName: "Alice", times: new Map([["seg-1", 100], ["seg-2", 200]]) }],
        ["user-2", { userName: "Bob", times: new Map([["seg-1", 90]]) }], // Only seg-1
      ]);

      const standings = calculateTimeStandings(userEfforts, ["seg-1", "seg-2"]);

      expect(standings.length).toBe(1);
      expect(standings[0].userName).toBe("Alice");
    });

    it("should sort by total time ascending", () => {
      const userEfforts = new Map([
        ["user-1", { userName: "Alice", times: new Map([["seg-1", 150]]) }],
        ["user-2", { userName: "Bob", times: new Map([["seg-1", 100]]) }],
        ["user-3", { userName: "Charlie", times: new Map([["seg-1", 200]]) }],
      ]);

      const standings = calculateTimeStandings(userEfforts, ["seg-1"]);

      expect(standings[0].userName).toBe("Bob");
      expect(standings[1].userName).toBe("Alice");
      expect(standings[2].userName).toBe("Charlie");
    });

    it("should return empty standings if no one completed all segments", () => {
      const userEfforts = new Map([
        ["user-1", { userName: "Alice", times: new Map([["seg-1", 100]]) }],
      ]);

      const standings = calculateTimeStandings(userEfforts, ["seg-1", "seg-2"]);

      expect(standings.length).toBe(0);
    });
  });

  describe("calculateStandings", () => {
    const sampleEfforts: Effort[] = [
      { userId: "user-1", userName: "Alice", segmentId: "seg-1", elapsedTime: 100 },
      { userId: "user-1", userName: "Alice", segmentId: "seg-2", elapsedTime: 200 },
      { userId: "user-2", userName: "Bob", segmentId: "seg-1", elapsedTime: 90 },
      { userId: "user-2", userName: "Bob", segmentId: "seg-2", elapsedTime: 250 },
    ];
    const segmentIds = ["seg-1", "seg-2"];

    it("should use points calculation for POINTS mode", () => {
      const standings = calculateStandings(sampleEfforts, segmentIds, "POINTS");

      // Both should have 18 points (tied)
      expect(standings[0].score).toBe(18);
      expect(standings[1].score).toBe(18);
    });

    it("should use time calculation for TIME mode", () => {
      const standings = calculateStandings(sampleEfforts, segmentIds, "TIME");

      // Alice: 300, Bob: 340
      expect(standings[0].userName).toBe("Alice");
      expect(standings[0].score).toBe(300);
      expect(standings[1].userName).toBe("Bob");
      expect(standings[1].score).toBe(340);
    });

    it("should handle empty efforts", () => {
      const standings = calculateStandings([], ["seg-1"], "POINTS");
      expect(standings).toEqual([]);
    });
  });
});
