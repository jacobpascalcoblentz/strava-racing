import { prisma } from "@/lib/prisma";
import { ScoringMode } from "@prisma/client";

interface Segment {
  id: string;
  name: string;
}

interface Props {
  raceId: string;
  segments: Segment[];
  scoringMode: ScoringMode;
}

// Points awarded for positions 1-10
const POINTS_TABLE = [10, 8, 6, 5, 4, 3, 2, 1, 1, 1];

export async function Leaderboard({ raceId, segments, scoringMode }: Props) {
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

  // Group efforts by user and calculate best times per segment
  const userEfforts = new Map<
    string,
    { user: { id: string; name: string }; times: Map<string, number> }
  >();

  for (const effort of efforts) {
    if (!userEfforts.has(effort.userId)) {
      userEfforts.set(effort.userId, {
        user: { id: effort.user.id, name: effort.user.name },
        times: new Map(),
      });
    }

    const userEntry = userEfforts.get(effort.userId)!;
    // Only keep best time per segment
    const existingTime = userEntry.times.get(effort.segmentId);
    if (!existingTime || effort.elapsedTime < existingTime) {
      userEntry.times.set(effort.segmentId, effort.elapsedTime);
    }
  }

  // Calculate standings based on scoring mode
  let standings: {
    user: { id: string; name: string };
    times: Map<string, number>;
    points: Map<string, number>;
    score: number;
  }[];

  if (scoringMode === "POINTS") {
    // Calculate points for each segment
    const segmentRankings = new Map<string, { userId: string; time: number }[]>();

    for (const segId of segments.map(s => s.id)) {
      const segmentTimes: { userId: string; time: number }[] = [];
      for (const [userId, entry] of userEfforts) {
        const time = entry.times.get(segId);
        if (time) {
          segmentTimes.push({ userId, time });
        }
      }
      segmentTimes.sort((a, b) => a.time - b.time);
      segmentRankings.set(segId, segmentTimes);
    }

    // Calculate points for each user
    standings = Array.from(userEfforts.entries()).map(([userId, entry]) => {
      const points = new Map<string, number>();
      let totalPoints = 0;

      for (const segId of segments.map(s => s.id)) {
        const rankings = segmentRankings.get(segId) || [];
        const position = rankings.findIndex(r => r.userId === userId);
        if (position !== -1) {
          const pointsEarned = POINTS_TABLE[position] || 0;
          points.set(segId, pointsEarned);
          totalPoints += pointsEarned;
        }
      }

      return {
        user: entry.user,
        times: entry.times,
        points,
        score: totalPoints,
      };
    });

    // Sort by points (higher is better)
    standings.sort((a, b) => b.score - a.score);
  } else {
    // TIME mode - sum of best times
    standings = Array.from(userEfforts.values())
      .filter((u) => u.times.size === segments.length) // Only show users who completed all segments
      .map((entry) => {
        let total = 0;
        for (const time of entry.times.values()) {
          total += time;
        }
        return {
          user: entry.user,
          times: entry.times,
          points: new Map<string, number>(),
          score: total,
        };
      });

    // Sort by time (lower is better)
    standings.sort((a, b) => a.score - b.score);
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function getMedalEmoji(position: number) {
    if (position === 0) return "🥇";
    if (position === 1) return "🥈";
    if (position === 2) return "🥉";
    return "";
  }

  const isPointsMode = scoringMode === "POINTS";

  return (
    <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span>🏆</span> Leaderboard
          <span className="ml-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
            {isPointsMode ? "Points" : "Time"}
          </span>
        </h2>
      </div>

      {standings.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-4xl mb-3">🚴</div>
          <p className="text-gray-500 dark:text-gray-400">
            {isPointsMode
              ? "No efforts yet. Complete segments to earn points!"
              : "No completed efforts yet. Complete all segments to appear on the leaderboard."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="py-4 px-4 font-bold text-gray-600 dark:text-gray-300">#</th>
                <th className="py-4 px-4 font-bold text-gray-600 dark:text-gray-300">Athlete</th>
                {segments.map((seg) => (
                  <th key={seg.id} className="py-4 px-4 text-center font-bold text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                    {seg.name}
                  </th>
                ))}
                <th className="py-4 px-4 text-right font-bold text-gray-600 dark:text-gray-300">
                  {isPointsMode ? "Points" : "Total"}
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, index) => (
                <tr
                  key={entry.user.id}
                  className={`border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                    index < 3 ? "bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-900/10" : ""
                  }`}
                >
                  <td className="py-4 px-4">
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {getMedalEmoji(index)} {index + 1}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-100">
                    {entry.user.name}
                  </td>
                  {segments.map((seg) => (
                    <td key={seg.id} className="py-4 px-4 text-center">
                      {entry.times.has(seg.id) ? (
                        <div>
                          <div className="text-gray-800 dark:text-gray-100">
                            {formatTime(entry.times.get(seg.id)!)}
                          </div>
                          {isPointsMode && entry.points.has(seg.id) && (
                            <div className="text-xs text-orange-500 font-medium">
                              +{entry.points.get(seg.id)} pts
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                  <td className="py-4 px-4 text-right">
                    <span className={`font-bold text-lg ${index === 0 ? "text-orange-500" : "text-gray-800 dark:text-gray-100"}`}>
                      {isPointsMode ? `${entry.score} pts` : formatTime(entry.score)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isPointsMode && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-center text-sm text-gray-500 dark:text-gray-400">
          Points: 1st = 10, 2nd = 8, 3rd = 6, 4th = 5, 5th = 4, 6th = 3, 7th = 2, 8th-10th = 1
        </div>
      )}
    </section>
  );
}
