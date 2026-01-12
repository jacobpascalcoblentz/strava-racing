// Test fixtures for database models

export const mockUser = {
  id: "user-1",
  stravaId: 12345,
  name: "Test User",
  accessToken: "encrypted-access-token",
  refreshToken: "encrypted-refresh-token",
  tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
  createdAt: new Date("2024-01-01"),
};

export const mockUser2 = {
  id: "user-2",
  stravaId: 67890,
  name: "Test User 2",
  accessToken: "encrypted-access-token-2",
  refreshToken: "encrypted-refresh-token-2",
  tokenExpiry: new Date(Date.now() + 3600000),
  createdAt: new Date("2024-01-02"),
};

export const mockRace = {
  id: "race-1",
  slug: "test-race-abc123",
  name: "Test Race",
  description: "A test race description",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  scoringMode: "TIME" as const,
  organizerId: "user-1",
  createdAt: new Date("2024-01-01"),
};

export const mockRacePoints = {
  ...mockRace,
  id: "race-2",
  slug: "points-race-xyz789",
  name: "Points Race",
  scoringMode: "POINTS" as const,
};

export const mockSegment = {
  id: "segment-1",
  stravaSegmentId: 12345,
  name: "Test Climb",
  distance: 5000, // 5km
  averageGrade: 5.5,
  raceId: "race-1",
};

export const mockSegment2 = {
  id: "segment-2",
  stravaSegmentId: 67890,
  name: "Test Sprint",
  distance: 1000, // 1km
  averageGrade: 0.5,
  raceId: "race-1",
};

export const mockParticipant = {
  id: "participant-1",
  raceId: "race-1",
  userId: "user-1",
  joinedAt: new Date("2024-01-15"),
};

export const mockParticipant2 = {
  id: "participant-2",
  raceId: "race-1",
  userId: "user-2",
  joinedAt: new Date("2024-01-16"),
};

export const mockEffort = {
  id: "effort-1",
  segmentId: "segment-1",
  userId: "user-1",
  elapsedTime: 600, // 10 minutes
  activityDate: new Date("2024-06-01"),
  stravaEffortId: BigInt(111111),
};

export const mockEffort2 = {
  id: "effort-2",
  segmentId: "segment-1",
  userId: "user-2",
  elapsedTime: 650, // 10:50
  activityDate: new Date("2024-06-02"),
  stravaEffortId: BigInt(222222),
};

export const mockEffort3 = {
  id: "effort-3",
  segmentId: "segment-2",
  userId: "user-1",
  elapsedTime: 120, // 2 minutes
  activityDate: new Date("2024-06-01"),
  stravaEffortId: BigInt(333333),
};

export const mockEffort4 = {
  id: "effort-4",
  segmentId: "segment-2",
  userId: "user-2",
  elapsedTime: 115, // 1:55
  activityDate: new Date("2024-06-02"),
  stravaEffortId: BigInt(444444),
};

// Strava API mock responses
export const mockStravaSegment = {
  id: 12345,
  name: "Test Climb",
  distance: 5000,
  average_grade: 5.5,
  city: "San Francisco",
  state: "CA",
  country: "USA",
  climb_category: 3,
  elev_difference: 275,
  start_latlng: [37.7749, -122.4194] as [number, number],
  end_latlng: [37.7849, -122.4094] as [number, number],
  points: "encodedPolylineString",
};

export const mockStravaEffort = {
  id: 111111,
  elapsed_time: 600,
  start_date: "2024-06-01T10:00:00Z",
  segment: {
    id: 12345,
  },
};

// Session mock
export const mockSession = {
  user: {
    id: "user-1",
    name: "Test User",
    stravaId: 12345,
  },
};
