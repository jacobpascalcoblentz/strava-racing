/**
 * @jest-environment node
 */

/**
 * API tests for /api/races endpoints
 */

import { NextRequest } from "next/server";

// Mock session
const mockGetSession = jest.fn();
jest.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

// Mock prisma
const mockRaceCreate = jest.fn();
const mockRaceUpdate = jest.fn();
const mockRaceFindUnique = jest.fn();
jest.mock("@/lib/prisma", () => ({
  prisma: {
    race: {
      create: () => mockRaceCreate(),
      update: (...args: unknown[]) => mockRaceUpdate(...args),
      findUnique: (...args: unknown[]) => mockRaceFindUnique(...args),
    },
  },
}));

// Mock rate limiter
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
  getRateLimitKey: jest.fn().mockReturnValue("test-key"),
  rateLimitResponse: jest.fn(),
  apiRateLimitConfig: {},
}));

// Import route handler after mocks
import { POST } from "@/app/api/races/route";

describe("POST /api/races", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/races", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Race",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if name is missing", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const request = new NextRequest("http://localhost:3000/api/races", {
      method: "POST",
      body: JSON.stringify({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/required|invalid|undefined/i);
  });

  it("should return 400 if name contains invalid characters", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const request = new NextRequest("http://localhost:3000/api/races", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Race <script>alert('xss')</script>",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("only contain");
  });

  it("should return 400 if end date is before start date", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const request = new NextRequest("http://localhost:3000/api/races", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Race",
        startDate: "2024-12-31",
        endDate: "2024-01-01",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("End date must be after start date");
  });

  it("should return 400 if end date is more than 1 year in the future", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const request = new NextRequest("http://localhost:3000/api/races", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Race",
        startDate: new Date().toISOString(),
        endDate: futureDate.toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("1 year");
  });

  it("should create race and return 200 on valid input", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockRaceCreate.mockResolvedValue({
      id: "race-1",
      name: "Test Race",
      slug: "test-race-abc123",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      scoringMode: "TIME",
      organizerId: "user-1",
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const request = new NextRequest("http://localhost:3000/api/races", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Race",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("race-1");
    expect(data.name).toBe("Test Race");
    expect(mockRaceCreate).toHaveBeenCalled();
  });

  it("should create race with POINTS scoring mode", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockRaceCreate.mockResolvedValue({
      id: "race-1",
      name: "Points Race",
      slug: "points-race-abc123",
      scoringMode: "POINTS",
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const request = new NextRequest("http://localhost:3000/api/races", {
      method: "POST",
      body: JSON.stringify({
        name: "Points Race",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        scoringMode: "POINTS",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.scoringMode).toBe("POINTS");
  });

  it("should return 500 on database error", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockRaceCreate.mockRejectedValue(new Error("Database error"));

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const request = new NextRequest("http://localhost:3000/api/races", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Race",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create race");
  });
});
