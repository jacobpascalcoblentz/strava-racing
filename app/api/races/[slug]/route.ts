import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const race = await prisma.race.findUnique({
    where: { slug },
    include: {
      organizer: true,
      segments: true,
      participants: {
        include: { user: true },
      },
    },
  });

  if (!race) {
    return NextResponse.json({ error: "Race not found" }, { status: 404 });
  }

  return NextResponse.json(race);
}

export async function PUT(
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
        { error: "Only the organizer can edit this race" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, startDate, endDate } = body;

    const updatedRace = await prisma.race.update({
      where: { slug },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });

    return NextResponse.json(updatedRace);
  } catch (error) {
    console.error("Update race error:", error);
    return NextResponse.json(
      { error: "Failed to update race" },
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
        { error: "Only the organizer can delete this race" },
        { status: 403 }
      );
    }

    await prisma.race.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Race deleted" });
  } catch (error) {
    console.error("Delete race error:", error);
    return NextResponse.json(
      { error: "Failed to delete race" },
      { status: 500 }
    );
  }
}
