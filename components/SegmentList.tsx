"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ElevationProfile } from "./ElevationProfile";

interface Segment {
  id: string;
  stravaSegmentId: number;
  name: string;
  distance: number;
  averageGrade: number;
}

interface SegmentListProps {
  segments: Segment[];
  raceSlug: string;
  isOrganizer: boolean;
}

export function SegmentList({ segments, raceSlug, isOrganizer }: SegmentListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(segment: Segment) {
    if (!confirm(`Remove "${segment.name}" from this race?`)) return;

    setDeletingId(segment.stravaSegmentId);
    try {
      const res = await fetch(`/api/races/${raceSlug}/segments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId: segment.stravaSegmentId }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (segments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
        <div className="text-4xl mb-3">🔍</div>
        {isOrganizer ? (
          <p className="text-gray-500 dark:text-gray-400">No segments added yet. Use the search above to add segments!</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">The organizer hasn&apos;t added any segments yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => (
        <div
          key={segment.id}
          className="group bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-orange-500 transition-colors">
                  {segment.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    📏 {(segment.distance / 1000).toFixed(2)} km
                  </span>
                  <span className="flex items-center gap-1">
                    ⛰️ {segment.averageGrade.toFixed(1)}% grade
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <ElevationProfile
                  elevationGain={segment.distance * (segment.averageGrade / 100)}
                  averageGrade={segment.averageGrade}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://www.strava.com/segments/${segment.stravaSegmentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                View on Strava →
              </a>
              {isOrganizer && (
                <button
                  onClick={() => handleDelete(segment)}
                  disabled={deletingId === segment.stravaSegmentId}
                  className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  title="Remove segment"
                >
                  {deletingId === segment.stravaSegmentId ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span>🗑️</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
