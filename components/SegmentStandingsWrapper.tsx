import { prisma } from "@/lib/prisma";
import { SegmentStandings } from "./SegmentStandings";

interface Props {
  raceId: string;
}

export async function SegmentStandingsWrapper({ raceId }: Props) {
  // Get all segments with their efforts
  const segments = await prisma.raceSegment.findMany({
    where: { raceId },
    include: {
      efforts: {
        include: { user: true },
        orderBy: { elapsedTime: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });

  // Group efforts by user per segment (keep only best time)
  const segmentData = segments.map((segment) => {
    const bestEfforts = new Map<string, { userId: string; userName: string; time: number }>();

    for (const effort of segment.efforts) {
      const existing = bestEfforts.get(effort.userId);
      if (!existing || effort.elapsedTime < existing.time) {
        bestEfforts.set(effort.userId, {
          userId: effort.userId,
          userName: effort.user.name,
          time: effort.elapsedTime,
        });
      }
    }

    // Convert to array and sort by time
    const sortedEfforts = Array.from(bestEfforts.values())
      .sort((a, b) => a.time - b.time)
      .map((effort, index) => ({
        ...effort,
        position: index + 1,
      }));

    return {
      id: segment.id,
      name: segment.name,
      distance: segment.distance,
      averageGrade: segment.averageGrade,
      efforts: sortedEfforts,
    };
  });

  return <SegmentStandings segments={segmentData} />;
}
