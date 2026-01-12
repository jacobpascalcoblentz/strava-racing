import { mockUser, mockStravaSegment, mockStravaEffort } from "../fixtures";

// Mock the prisma module before importing strava
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock crypto module
jest.mock("@/lib/crypto", () => ({
  encrypt: jest.fn((value) => `encrypted:${value}`),
  decrypt: jest.fn((value) => value.replace("encrypted:", "")),
}));

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

// Import the functions to test
import { refreshAccessToken, searchSegments, getSegment, getSegmentEfforts } from "@/lib/strava";

describe("lib/strava", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe("refreshAccessToken", () => {
    it("should return existing token if not expired", async () => {
      const futureExpiry = new Date(Date.now() + 3600000);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        accessToken: "encrypted:valid-token",
        tokenExpiry: futureExpiry,
      });

      const token = await refreshAccessToken("user-1");

      expect(token).toBe("valid-token");
      expect(decrypt).toHaveBeenCalledWith("encrypted:valid-token");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should refresh token if expired", async () => {
      const pastExpiry = new Date(Date.now() - 3600000);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        accessToken: "encrypted:old-token",
        refreshToken: "encrypted:refresh-token",
        tokenExpiry: pastExpiry,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          }),
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const token = await refreshAccessToken("user-1");

      expect(token).toBe("new-access-token");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://www.strava.com/oauth/token",
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("should throw error if user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(refreshAccessToken("nonexistent")).rejects.toThrow("User not found");
    });

    it("should throw error if refresh fails", async () => {
      const pastExpiry = new Date(Date.now() - 3600000);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        tokenExpiry: pastExpiry,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(refreshAccessToken("user-1")).rejects.toThrow("Failed to refresh token");
    });
  });

  describe("searchSegments", () => {
    it("should return segments from Strava API", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ segments: [mockStravaSegment] }),
      });

      const segments = await searchSegments("access-token", {
        sw_lat: 37.7,
        sw_lng: -122.5,
        ne_lat: 37.8,
        ne_lng: -122.4,
      });

      expect(segments).toEqual([mockStravaSegment]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("segments/explore"),
        expect.objectContaining({
          headers: { Authorization: "Bearer access-token" },
        })
      );
    });

    it("should throw error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(
        searchSegments("access-token", {
          sw_lat: 37.7,
          sw_lng: -122.5,
          ne_lat: 37.8,
          ne_lng: -122.4,
        })
      ).rejects.toThrow("Failed to search segments");
    });
  });

  describe("getSegment", () => {
    it("should return segment details", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStravaSegment),
      });

      const segment = await getSegment("access-token", 12345);

      expect(segment).toEqual(mockStravaSegment);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://www.strava.com/api/v3/segments/12345",
        expect.objectContaining({
          headers: { Authorization: "Bearer access-token" },
        })
      );
    });

    it("should throw error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(getSegment("access-token", 12345)).rejects.toThrow("Failed to get segment");
    });
  });

  describe("getSegmentEfforts", () => {
    it("should return efforts within date range", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockStravaEffort]),
      });

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      const efforts = await getSegmentEfforts("access-token", 12345, startDate, endDate);

      expect(efforts).toEqual([mockStravaEffort]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("segment_efforts"),
        expect.any(Object)
      );
    });

    it("should throw error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(
        getSegmentEfforts("access-token", 12345, new Date(), new Date())
      ).rejects.toThrow("Failed to get segment efforts");
    });
  });
});
