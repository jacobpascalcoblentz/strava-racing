import Link from "next/link";
import { getSession, clearSession } from "@/lib/session";

export async function Navbar() {
  const session = await getSession();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-500">
          Strava Racing
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {session.user.name}
              </span>
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/races/new"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
              >
                Create Race
              </Link>
              <form
                action={async () => {
                  "use server";
                  await clearSession();
                }}
              >
                <button
                  type="submit"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/api/auth/strava"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              Sign in with Strava
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
