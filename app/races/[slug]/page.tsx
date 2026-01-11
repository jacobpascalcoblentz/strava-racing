import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
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
  const session = await auth();

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{race.name}</h1>
            <p className="text-gray-500">
              Organized by {race.organizer.name}
            </p>
          </div>
          <div className="text-right">
            {isActive ? (
              <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm">
                Active
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                Ended
              </span>
            )}
          </div>
        </div>

        {race.description && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {race.description}
          </p>
        )}

        <div className="mt-4 flex gap-6 text-sm text-gray-500">
          <div>
            <strong>Start:</strong>{" "}
            {new Date(race.startDate).toLocaleDateString()}
          </div>
          <div>
            <strong>End:</strong>{" "}
            {new Date(race.endDate).toLocaleDateString()}
          </div>
          <div>
            <strong>Participants:</strong> {race.participants.length}
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
        <h2 className="text-xl font-semibold mb-4">
          Segments ({race.segments.length})
        </h2>
        {race.segments.length === 0 ? (
          <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center text-gray-500">
            {isOrganizer ? (
              <p>No segments added yet. Use the form above to add segments.</p>
            ) : (
              <p>The organizer hasn&apos;t added any segments yet.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {race.segments.map((segment) => (
              <div
                key={segment.id}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{segment.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(segment.distance / 1000).toFixed(2)} km &bull;{" "}
                      {segment.averageGrade.toFixed(1)}% avg grade
                    </p>
                  </div>
                  <a
                    href={`https://www.strava.com/segments/${segment.stravaSegmentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:underline text-sm"
                  >
                    View on Strava
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sync efforts button for participants */}
      {(isParticipant || isOrganizer) && race.segments.length > 0 && (
        <div className="mb-6">
          <RefreshButton slug={race.slug} />
        </div>
      )}

      {/* Leaderboard */}
      <Leaderboard raceId={race.id} segments={race.segments} />

      {/* Share section */}
      <ShareLink url={`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/races/${race.slug}`} />
    </div>
  );
}
