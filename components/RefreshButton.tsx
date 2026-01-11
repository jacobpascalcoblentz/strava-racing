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
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
      >
        {loading ? "Syncing..." : "Sync My Efforts"}
      </button>
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {message}
        </span>
      )}
    </div>
  );
}
