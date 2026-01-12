"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRace() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      scoringMode: formData.get("scoringMode"),
    };

    try {
      const res = await fetch("/api/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create race");
      }

      const race = await res.json();
      router.push(`/races/${race.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏁</div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Create a New Race
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Set up your race and invite your friends to compete!
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3">
                <span className="text-xl">😕</span>
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2"
              >
                🏷️ Race Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-5 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-900 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-200 text-lg"
                placeholder="Summer Hill Climb Challenge"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2"
              >
                📝 Description <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-5 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-900 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-200"
                placeholder="Tell participants what this race is about..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2"
                >
                  🗓️ Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  min={today}
                  className="w-full px-5 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-900 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-200"
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2"
                >
                  🏁 End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  min={today}
                  className="w-full px-5 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-900 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                🎯 Scoring Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="scoringMode"
                    value="TIME"
                    defaultChecked
                    className="peer sr-only"
                  />
                  <div className="p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 peer-checked:border-orange-400 peer-checked:bg-orange-50 dark:peer-checked:bg-orange-900/20 transition-all">
                    <div className="text-2xl mb-1">⏱️</div>
                    <div className="font-bold text-gray-800 dark:text-gray-100">Fastest Time</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lowest total time wins</div>
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="scoringMode"
                    value="POINTS"
                    className="peer sr-only"
                  />
                  <div className="p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 peer-checked:border-orange-400 peer-checked:bg-orange-50 dark:peer-checked:bg-orange-900/20 transition-all">
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="font-bold text-gray-800 dark:text-gray-100">Points</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Points for position (10-8-6-4-2-1)</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl text-lg font-bold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Create Race
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-2">
              <span>💡</span>
              After creating your race, you&apos;ll be able to add segments.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
