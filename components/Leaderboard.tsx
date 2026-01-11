import { prisma } from "@/lib/prisma";

interface Segment {
  id: string;
  name: string;
}

interface Props {
  raceId: string;
  segments: Segment[];
}

export async function Leaderboard({ raceId, segments }: Props) {
  if (segments.length === 0) {
    return null;
  }

  // Get all efforts for this race's segments
  const efforts = await prisma.segmentEffort.findMany({
    where: {
      segment: { raceId },
    },
    include: {
      user: true,
      segment: true,
    },
    orderBy: { elapsedTime: "asc" },
  });

  // Group efforts by user and calculate totals
  const userEfforts = new Map<
    string,
    { user: { id: string; name: string }; times: Map<string, number>; total: number }
  >();

  for (const effort of efforts) {
    if (!userEfforts.has(effort.userId)) {
      userEfforts.set(effort.userId, {
        user: { id: effort.user.id, name: effort.user.name },
        times: new Map(),
        total: 0,
      });
    }

    const userEntry = userEfforts.get(effort.userId)!;
    // Only keep best time per segment
    const existingTime = userEntry.times.get(effort.segmentId);
    if (!existingTime || effort.elapsedTime < existingTime) {
      if (existingTime) {
        userEntry.total -= existingTime;
      }
      userEntry.times.set(effort.segmentId, effort.elapsedTime);
      userEntry.total += effort.elapsedTime;
    }
  }

  // Sort by total time
  const standings = Array.from(userEfforts.values())
    .filter((u) => u.times.size === segments.length) // Only show users who completed all segments
    .sort((a, b) => a.total - b.total);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>

      {standings.length === 0 ? (
        <p className="text-gray-500">
          No completed efforts yet. Complete all segments to appear on the
          leaderboard.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="py-3 px-2">#</th>
                <th className="py-3 px-2">Athlete</th>
                {segments.map((seg) => (
                  <th key={seg.id} className="py-3 px-2 text-center">
                    {seg.name}
                  </th>
                ))}
                <th className="py-3 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, index) => (
                <tr
                  key={entry.user.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 px-2 font-medium">{index + 1}</td>
                  <td className="py-3 px-2">{entry.user.name}</td>
                  {segments.map((seg) => (
                    <td key={seg.id} className="py-3 px-2 text-center">
                      {entry.times.has(seg.id)
                        ? formatTime(entry.times.get(seg.id)!)
                        : "-"}
                    </td>
                  ))}
                  <td className="py-3 px-2 text-right font-semibold">
                    {formatTime(entry.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
