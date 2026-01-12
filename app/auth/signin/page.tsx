import Link from "next/link";

export default function SignIn() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Sign in to Strava Racing</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your Strava account to create and join races.
          </p>
        </div>

        <Link
          href="/api/auth/strava"
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" />
            <path
              d="M7.463 13.828L12 3.609l-4.537 10.22h4.15l-3.15 6.391-5.15-10.22h8.686L7.463 13.828z"
              opacity=".6"
            />
          </svg>
          Sign in with Strava
        </Link>

        <p className="mt-6 text-center text-sm text-gray-500">
          By signing in, you agree to share your Strava activities with this
          app.
        </p>
      </div>
    </div>
  );
}
