import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Fun floating emoji decoration */}
          <div className="text-6xl mb-6 animate-bounce">🚴‍♂️</div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
            Create Your Own
            <br />
            <span className="text-6xl md:text-7xl">Strava Race!</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Pick your favorite segments, set your dates, and challenge your friends!
            <span className="inline-block ml-2">🏆</span>
          </p>

          {session?.user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/races/new"
                className="group relative bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-orange-300 dark:hover:shadow-orange-900"
              >
                <span className="flex items-center justify-center gap-2">
                  🚀 Create a Race
                </span>
              </Link>
              <Link
                href="/dashboard"
                className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 px-8 py-4 rounded-2xl text-lg font-bold hover:border-orange-400 dark:hover:border-orange-500 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  📊 My Races
                </span>
              </Link>
            </div>
          ) : (
            <Link
              href="/api/auth/strava"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-orange-300 dark:hover:shadow-orange-900"
            >
              <span className="text-2xl">⚡</span>
              Get Started with Strava
            </Link>
          )}
        </div>

        {/* How it works section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
            How It Works ✨
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎯</div>
              <div className="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-bold px-3 py-1 rounded-full mb-3">Step 1</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Create a Race</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in with Strava and pick the segments you want to race on.
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔗</div>
              <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold px-3 py-1 rounded-full mb-3">Step 2</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Share the Link</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Send your unique race link to friends and challenge them!
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🏆</div>
              <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-bold px-3 py-1 rounded-full mb-3">Step 3</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Compete!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Watch the live leaderboard as everyone races to the top!
              </p>
            </div>
          </div>
        </div>

        {/* Fun footer decoration */}
        <div className="mt-20 text-center text-4xl opacity-50">
          🚵 🏔️ 🌄 🚴‍♀️
        </div>
      </div>
    </div>
  );
}
