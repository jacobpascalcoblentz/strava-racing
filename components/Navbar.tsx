import Link from "next/link";
import { getSession, clearSession } from "@/lib/session";

export async function Navbar() {
  const session = await getSession();

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">🚴</span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Strava Racing
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                <span>👋</span>
                {session.user.name}
              </span>
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30"
              >
                Dashboard
              </Link>
              <Link
                href="/races/new"
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl font-bold hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <span>✨</span> New Race
              </Link>
              <form
                action={async () => {
                  "use server";
                  await clearSession();
                }}
              >
                <button
                  type="submit"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/api/auth/strava"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>⚡</span> Sign in with Strava
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
