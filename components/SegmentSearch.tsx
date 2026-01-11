"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Segment {
  id: number;
  name: string;
  distance: number;
  avg_grade: number;
}

export function SegmentSearch({ raceSlug }: { raceSlug: string }) {
  const router = useRouter();
  const [segmentId, setSegmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [segment, setSegment] = useState<Segment | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!segmentId) return;

    setLoading(true);
    setError("");
    setSegment(null);

    try {
      const res = await fetch(`/api/strava/segments?id=${segmentId}`);
      if (!res.ok) throw new Error("Segment not found");
      const data = await res.json();
      setSegment(data);
    } catch {
      setError("Could not find segment. Check the ID and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!segment) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/races/${raceSlug}/segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId: segment.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add segment");
      }

      setSegment(null);
      setSegmentId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add segment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
      <h3 className="font-medium mb-4">Add Segment</h3>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={segmentId}
          onChange={(e) => setSegmentId(e.target.value)}
          placeholder="Enter Strava segment ID"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
        />
        <button
          type="submit"
          disabled={loading || !segmentId}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          {loading ? "..." : "Search"}
        </button>
      </form>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      {segment && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-medium">{segment.name}</p>
            <p className="text-sm text-gray-500">
              {(segment.distance / 1000).toFixed(2)} km &bull;{" "}
              {segment.avg_grade?.toFixed(1) || 0}% avg grade
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Find segment IDs in Strava URLs: strava.com/segments/<strong>12345</strong>
      </p>
    </div>
  );
}
