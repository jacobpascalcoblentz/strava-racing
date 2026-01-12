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
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <span>🏁</span> My Races
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track your racing adventures!</p>
          </div>
          <Link
            href="/races/new"
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl font-bold hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/50 flex items-center gap-2"
          >
            <span>🚀</span> Create Race
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <span className="text-2xl">👑</span> Races I Organize
          </h2>
          {organizedRaces.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                You haven&apos;t created any races yet.
              </p>
              <Link
                href="/races/new"
                className="inline-block mt-4 text-orange-500 hover:text-orange-600 font-medium"
              >
                Create your first race →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {organizedRaces.map((race: OrganizedRace) => (
                <Link
                  key={race.id}
                  href={`/races/${race.slug}`}
                  className="group block bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 group-hover:text-orange-500 transition-colors flex items-center gap-2">
                        {race.name}
                        <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span>🛤️</span> {race._count.segments} segments
                        </span>
                        <span className="flex items-center gap-1">
                          <span>👥</span> {race._count.participants} riders
                        </span>
                      </div>
                    </div>
                    <div>
                      {new Date(race.endDate) > new Date() ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-sm font-medium">
                          Ended
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-6 text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <span className="text-2xl">🏃</span> Races I&apos;m In
          </h2>
          {participatingRaces.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                You haven&apos;t joined any races yet.
              </p>
              <p className="text-gray-400 dark:text-gray-500 mt-2 text-sm">
                Ask friends to share their race links with you!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {participatingRaces.map(({ race }: ParticipatingRace) => (
                <Link
                  key={race.id}
                  href={`/races/${race.slug}`}
                  className="group block bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 group-hover:text-orange-500 transition-colors flex items-center gap-2">
                        {race.name}
                        <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span>👤</span> by {race.organizer.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🛤️</span> {race._count.segments} segments
                        </span>
                      </div>
                    </div>
                    <div>
                      {new Date(race.endDate) > new Date() ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-sm font-medium">
                          Ended
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
