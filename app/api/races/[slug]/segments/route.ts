import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { refreshAccessToken, getSegment } from "@/lib/strava";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  const { slug } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const race = await prisma.race.findUnique({
      where: { slug },
    });

    if (!race) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    if (race.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the organizer can add segments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { segmentId } = body;

    if (!segmentId) {
      return NextResponse.json(
        { error: "Segment ID is required" },
        { status: 400 }
      );
    }

    // Check if segment already exists in this race
    const existing = await prisma.raceSegment.findFirst({
      where: {
        raceId: race.id,
        stravaSegmentId: segmentId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Segment already added to this race" },
        { status: 400 }
      );
    }

    // Fetch segment details from Strava
    const accessToken = await refreshAccessToken(session.user.id);
    const stravaSegment = await getSegment(accessToken, segmentId);

    // Add segment to race
    const raceSegment = await prisma.raceSegment.create({
      data: {
        raceId: race.id,
        stravaSegmentId: segmentId,
        name: stravaSegment.name,
        distance: stravaSegment.distance,
        averageGrade: stravaSegment.average_grade,
      },
    });

    return NextResponse.json(raceSegment);
  } catch (error) {
    console.error("Add segment error:", error);
    return NextResponse.json(
      { error: "Failed to add segment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  const { slug } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const race = await prisma.race.findUnique({
      where: { slug },
    });

    if (!race) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    if (race.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the organizer can remove segments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { segmentId } = body;

    await prisma.raceSegment.deleteMany({
      where: {
        raceId: race.id,
        stravaSegmentId: segmentId,
      },
    });

    return NextResponse.json({ message: "Segment removed" });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove segment" },
      { status: 500 }
    );
  }
}
