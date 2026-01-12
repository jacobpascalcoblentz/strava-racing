/**
 * Leaderboard calculation logic
 * Extracted from the Leaderboard component for testability
 */

import { ScoringMode } from "@prisma/client";

// Points awarded for positions 1-10
export const POINTS_TABLE = [10, 8, 6, 5, 4, 3, 2, 1, 1, 1];

export interface Effort {
  userId: string;
  userName: string;
  segmentId: string;
  elapsedTime: number;
}

export interface UserStanding {
  userId: string;
  userName: string;
  times: Map<string, number>;
  points: Map<string, number>;
  score: number;
}

/**
 * Groups efforts by user and keeps only the best time per segment
 */
export function groupEffortsByUser(
  efforts: Effort[]
): Map<string, { userName: string; times: Map<string, number> }> {
  const userEfforts = new Map<
    string,
    { userName: string; times: Map<string, number> }
  >();

  for (const effort of efforts) {
    if (!userEfforts.has(effort.userId)) {
      userEfforts.set(effort.userId, {
        userName: effort.userName,
        times: new Map(),
      });
    }

    const userEntry = userEfforts.get(effort.userId)!;
    // Only keep best time per segment
    const existingTime = userEntry.times.get(effort.segmentId);
    if (!existingTime || effort.elapsedTime < existingTime) {
      userEntry.times.set(effort.segmentId, effort.elapsedTime);
    }
  }

  return userEfforts;
}

/**
 * Calculates standings for POINTS mode
 * Points are awarded based on position: 1st=10, 2nd=8, 3rd=6, 4th=5, 5th=4, 6th=3, 7th=2, 8th-10th=1
 */
export function calculatePointsStandings(
  userEfforts: Map<string, { userName: string; times: Map<string, number> }>,
  segmentIds: string[]
): UserStanding[] {
  // Calculate rankings for each segment
  const segmentRankings = new Map<string, { userId: string; time: number }[]>();

  for (const segId of segmentIds) {
    const segmentTimes: { userId: string; time: number }[] = [];
    for (const [userId, entry] of userEfforts) {
      const time = entry.times.get(segId);
      if (time) {
        segmentTimes.push({ userId, time });
      }
    }
    segmentTimes.sort((a, b) => a.time - b.time);
    segmentRankings.set(segId, segmentTimes);
  }

  // Calculate points for each user
  const standings = Array.from(userEfforts.entries()).map(([userId, entry]) => {
    const points = new Map<string, number>();
    let totalPoints = 0;

    for (const segId of segmentIds) {
      const rankings = segmentRankings.get(segId) || [];
      const position = rankings.findIndex((r) => r.userId === userId);
      if (position !== -1) {
        const pointsEarned = POINTS_TABLE[position] || 0;
        points.set(segId, pointsEarned);
        totalPoints += pointsEarned;
      }
    }

    return {
      userId,
      userName: entry.userName,
      times: entry.times,
      points,
      score: totalPoints,
    };
  });

  // Sort by points (higher is better)
  standings.sort((a, b) => b.score - a.score);
  return standings;
}

/**
 * Calculates standings for TIME mode
 * Score is the sum of best times for all segments
 * Only users who have completed all segments are included
 */
export function calculateTimeStandings(
  userEfforts: Map<string, { userName: string; times: Map<string, number> }>,
  segmentIds: string[]
): UserStanding[] {
  const standings = Array.from(userEfforts.entries())
    .filter(([, entry]) => entry.times.size === segmentIds.length) // Only users who completed all segments
    .map(([userId, entry]) => {
      let total = 0;
      for (const time of entry.times.values()) {
        total += time;
      }
      return {
        userId,
        userName: entry.userName,
        times: entry.times,
        points: new Map<string, number>(),
        score: total,
      };
    });

  // Sort by time (lower is better)
  standings.sort((a, b) => a.score - b.score);
  return standings;
}

/**
 * Main function to calculate standings based on scoring mode
 */
export function calculateStandings(
  efforts: Effort[],
  segmentIds: string[],
  scoringMode: ScoringMode
): UserStanding[] {
  const userEfforts = groupEffortsByUser(efforts);

  if (scoringMode === "POINTS") {
    return calculatePointsStandings(userEfforts, segmentIds);
  } else {
    return calculateTimeStandings(userEfforts, segmentIds);
  }
}

/**
 * Format seconds to MM:SS string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
