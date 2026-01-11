import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
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

    if (new Date(race.endDate) < new Date()) {
      return NextResponse.json({ error: "Race has ended" }, { status: 400 });
    }

    // Check if already a participant
    const existing = await prisma.raceParticipant.findUnique({
      where: {
        raceId_userId: {
          raceId: race.id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already joined" });
    }

    await prisma.raceParticipant.create({
      data: {
        raceId: race.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Joined successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to join race" }, { status: 500 });
  }
}
