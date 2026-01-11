import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { refreshAccessToken, searchSegments, getSegment } from "@/lib/strava";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const segmentId = searchParams.get("id");
  const swLat = searchParams.get("sw_lat");
  const swLng = searchParams.get("sw_lng");
  const neLat = searchParams.get("ne_lat");
  const neLng = searchParams.get("ne_lng");

  try {
    const accessToken = await refreshAccessToken(session.user.id);

    // If segment ID is provided, get specific segment
    if (segmentId) {
      const segment = await getSegment(accessToken, parseInt(segmentId));
      return NextResponse.json(segment);
    }

    // Otherwise, search by bounds
    if (!swLat || !swLng || !neLat || !neLng) {
      return NextResponse.json(
        { error: "Provide either segment ID or bounding box coordinates" },
        { status: 400 }
      );
    }

    const segments = await searchSegments(accessToken, {
      sw_lat: parseFloat(swLat),
      sw_lng: parseFloat(swLng),
      ne_lat: parseFloat(neLat),
      ne_lng: parseFloat(neLng),
    });

    return NextResponse.json(segments);
  } catch (error) {
    console.error("Segment search error:", error);
    return NextResponse.json(
      { error: "Failed to search segments" },
      { status: 500 }
    );
  }
}
