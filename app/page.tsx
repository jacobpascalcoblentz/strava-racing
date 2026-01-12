import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6">
          Create Your Own{" "}
          <span className="text-orange-500">Strava Race</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Pick your segments, set your dates, and share a unique link. Compete
          with friends on the leaderboard.
        </p>

        {session?.user ? (
          <div className="flex gap-4 justify-center">
            <Link
              href="/races/new"
              className="bg-orange-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-orange-600"
            >
              Create a Race
            </Link>
            <Link
              href="/dashboard"
              className="border border-gray-300 dark:border-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              My Races
            </Link>
          </div>
        ) : (
          <Link
            href="/api/auth/strava"
            className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-orange-600"
          >
            Get Started with Strava
          </Link>
        )}
      </div>

      <div className="mt-24 grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="text-4xl mb-4">1</div>
          <h3 className="text-xl font-semibold mb-2">Create a Race</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in with Strava and select the segments for your race.
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-4">2</div>
          <h3 className="text-xl font-semibold mb-2">Share the Link</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Send your unique race link to friends and competitors.
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-4">3</div>
          <h3 className="text-xl font-semibold mb-2">Compete</h3>
          <p className="text-gray-600 dark:text-gray-400">
            See real-time standings as everyone races the segments.
          </p>
        </div>
      </div>
    </div>
  );
}
