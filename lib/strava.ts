import { prisma } from "./prisma";
import { encrypt, decrypt } from "./crypto";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

interface StravaSegment {
  id: number;
  name: string;
  distance: number;
  average_grade: number;
  avg_grade?: number;
  city?: string;
  state?: string;
  country?: string;
  climb_category?: number;
  elev_difference?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  points?: string; // Encoded polyline
}

interface StravaSegmentEffort {
  id: number;
  elapsed_time: number;
  start_date: string;
  segment: {
    id: number;
  };
}

export async function refreshAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if token is still valid
  if (new Date(user.tokenExpiry) > new Date()) {
    // Decrypt token before returning
    return decrypt(user.accessToken);
  }

  // Decrypt refresh token to use it
  const decryptedRefreshToken = decrypt(user.refreshToken);

  // Refresh the token
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: decryptedRefreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await res.json();

  // Encrypt new tokens before storing
  const encryptedAccessToken = encrypt(data.access_token);
  const encryptedRefreshToken = encrypt(data.refresh_token);

  // Update user with new encrypted tokens
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry: new Date(data.expires_at * 1000),
    },
  });

  return data.access_token;
}

export async function searchSegments(
  accessToken: string,
  bounds: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }
): Promise<StravaSegment[]> {
  const params = new URLSearchParams({
    bounds: `${bounds.sw_lat},${bounds.sw_lng},${bounds.ne_lat},${bounds.ne_lng}`,
    activity_type: "riding",
  });

  const res = await fetch(`${STRAVA_API_BASE}/segments/explore?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to search segments");
  }

  const data = await res.json();
  return data.segments || [];
}

export async function getSegment(
  accessToken: string,
  segmentId: number
): Promise<StravaSegment> {
  const res = await fetch(`${STRAVA_API_BASE}/segments/${segmentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to get segment");
  }

  return res.json();
}

export async function getSegmentEfforts(
  accessToken: string,
  segmentId: number,
  startDate: Date,
  endDate: Date
): Promise<StravaSegmentEffort[]> {
  const params = new URLSearchParams({
    start_date_local: startDate.toISOString(),
    end_date_local: endDate.toISOString(),
  });

  const res = await fetch(
    `${STRAVA_API_BASE}/segment_efforts?segment_id=${segmentId}&${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to get segment efforts");
  }

  return res.json();
}
