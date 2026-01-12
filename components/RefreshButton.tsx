"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRefresh() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/races/${slug}/refresh`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        router.refresh();
      } else {
        setMessage(data.error || "Failed to sync");
      }
    } catch {
      setMessage("Failed to sync efforts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">🔄</span>
            Syncing...
          </>
        ) : (
          <>
            <span>⚡</span>
            Sync My Efforts
          </>
        )}
      </button>
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {message}
        </span>
      )}
    </div>
  );
}
