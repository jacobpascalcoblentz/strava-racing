import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Race, User } from "@prisma/client";

type OrganizedRace = Race & { _count: { participants: number; segments: number } };
type ParticipatingRace = { race: Race & { organizer: User; _count: { participants: number; segments: number } } };

export default async function Dashboard() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/");
  }

  const [organizedRaces, participatingRaces] = await Promise.all([
    prisma.race.findMany({
      where: { organizerId: session.user.id },
      include: {
        _count: { select: { participants: true, segments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.raceParticipant.findMany({
      where: { userId: session.user.id },
      include: {
        race: {
          include: {
            organizer: true,
            _count: { select: { participants: true, segments: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Races</h1>
        <Link
          href="/races/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          Create Race
        </Link>
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Races I Organize</h2>
        {organizedRaces.length === 0 ? (
          <p className="text-gray-500">
            You haven&apos;t created any races yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {organizedRaces.map((race: OrganizedRace) => (
              <Link
                key={race.id}
                href={`/races/${race.slug}`}
                className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-orange-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{race.name}</h3>
                    <p className="text-sm text-gray-500">
                      {race._count.segments} segments &bull;{" "}
                      {race._count.participants} participants
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(race.endDate) > new Date() ? (
                      <span className="text-green-500">Active</span>
                    ) : (
                      <span className="text-gray-400">Ended</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Races I&apos;m In</h2>
        {participatingRaces.length === 0 ? (
          <p className="text-gray-500">
            You haven&apos;t joined any races yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {participatingRaces.map(({ race }: ParticipatingRace) => (
              <Link
                key={race.id}
                href={`/races/${race.slug}`}
                className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-orange-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{race.name}</h3>
                    <p className="text-sm text-gray-500">
                      by {race.organizer.name} &bull; {race._count.segments}{" "}
                      segments
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(race.endDate) > new Date() ? (
                      <span className="text-green-500">Active</span>
                    ) : (
                      <span className="text-gray-400">Ended</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
