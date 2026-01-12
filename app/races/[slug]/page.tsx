import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { JoinRaceButton } from "@/components/JoinRaceButton";
import { Leaderboard } from "@/components/Leaderboard";
import { SegmentSearch } from "@/components/SegmentSearch";
import { ShareLink } from "@/components/ShareLink";
import { RefreshButton } from "@/components/RefreshButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RacePage({ params }: Props) {
  const { slug } = await params;
  const session = await getSession();

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
    notFound();
  }

  const isOrganizer = session?.user?.id === race.organizerId;
  const isParticipant = race.participants.some(
    (p) => p.userId === session?.user?.id
  );
  const isActive = new Date(race.endDate) > new Date();

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <span>🏁</span> {race.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                <span>👤</span> Organized by <span className="font-medium text-gray-700 dark:text-gray-300">{race.organizer.name}</span>
              </p>
            </div>
            <div>
              {isActive ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full font-medium">
                  🏆 Ended
                </span>
              )}
            </div>
          </div>

          {race.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
              {race.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl">
              <span>🗓️</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Start:</strong> {new Date(race.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">
              <span>🏁</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>End:</strong> {new Date(race.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl">
              <span>👥</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>{race.participants.length}</strong> riders
              </span>
            </div>
          </div>
        </div>

        {/* Join button for non-participants */}
        {session?.user && !isParticipant && !isOrganizer && isActive && (
          <div className="mb-8">
            <JoinRaceButton slug={race.slug} />
          </div>
        )}

        {/* Segment search for organizers */}
        {isOrganizer && isActive && (
          <section className="mb-8">
            <SegmentSearch raceSlug={race.slug} />
          </section>
        )}

        {/* Segments section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span>🛤️</span> Segments ({race.segments.length})
          </h2>
          {race.segments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
              <div className="text-4xl mb-3">🔍</div>
              {isOrganizer ? (
                <p className="text-gray-500 dark:text-gray-400">No segments added yet. Use the search above to add segments!</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">The organizer hasn&apos;t added any segments yet.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {race.segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className="group bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-orange-500 transition-colors">
                          {segment.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            📏 {(segment.distance / 1000).toFixed(2)} km
                          </span>
                          <span className="flex items-center gap-1">
                            ⛰️ {segment.averageGrade.toFixed(1)}% grade
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={`https://www.strava.com/segments/${segment.stravaSegmentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View on Strava →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sync efforts button for participants */}
        {(isParticipant || isOrganizer) && race.segments.length > 0 && (
          <div className="mb-8">
            <RefreshButton slug={race.slug} />
          </div>
        )}

        {/* Leaderboard */}
        <Leaderboard raceId={race.id} segments={race.segments} />

        {/* Share section */}
        <ShareLink url={`${process.env.NEXTAUTH_URL}/races/${race.slug}`} />
      </div>
    </div>
  );
}
