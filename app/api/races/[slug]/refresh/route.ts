import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { refreshAccessToken, getSegmentEfforts } from "@/lib/strava";

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
      include: {
        segments: true,
        participants: {
          include: { user: true },
        },
      },
    });

    if (!race) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    // Check if user is a participant or organizer
    const isParticipant =
      race.participants.some((p: { userId: string }) => p.userId === session.user!.id) ||
      race.organizerId === session.user!.id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Only participants can refresh efforts" },
        { status: 403 }
      );
    }

    // Fetch efforts for the current user only
    const accessToken = await refreshAccessToken(session.user.id);
    let newEfforts = 0;

    for (const segment of race.segments) {
      try {
        const efforts = await getSegmentEfforts(
          accessToken,
          segment.stravaSegmentId,
          race.startDate,
          race.endDate
        );

        for (const effort of efforts) {
          // Upsert effort (update if exists, create if not)
          await prisma.segmentEffort.upsert({
            where: { stravaEffortId: BigInt(effort.id) },
            update: {
              elapsedTime: effort.elapsed_time,
              activityDate: new Date(effort.start_date),
            },
            create: {
              stravaEffortId: BigInt(effort.id),
              elapsedTime: effort.elapsed_time,
              activityDate: new Date(effort.start_date),
              segmentId: segment.id,
              userId: session.user!.id,
            },
          });
          newEfforts++;
        }
      } catch (error) {
        console.error(
          `Error fetching efforts for segment ${segment.stravaSegmentId}:`,
          error
        );
      }
    }

    return NextResponse.json({
      message: `Synced ${newEfforts} efforts`,
      count: newEfforts,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh efforts" },
      { status: 500 }
    );
  }
}
