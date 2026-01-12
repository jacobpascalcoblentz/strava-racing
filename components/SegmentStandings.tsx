"use client";

import { useState } from "react";

interface SegmentEffort {
  userId: string;
  userName: string;
  time: number;
  position: number;
}

interface SegmentData {
  id: string;
  name: string;
  distance: number;
  averageGrade: number;
  efforts: SegmentEffort[];
}

interface Props {
  segments: SegmentData[];
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getMedalEmoji(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return "";
}

export function SegmentStandings({ segments }: Props) {
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

  function toggleSegment(segmentId: string) {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) {
        next.delete(segmentId);
      } else {
        next.add(segmentId);
      }
      return next;
    });
  }

  function expandAll() {
    setExpandedSegments(new Set(segments.map((s) => s.id)));
  }

  function collapseAll() {
    setExpandedSegments(new Set());
  }

  if (segments.length === 0) {
    return null;
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span>📊</span> Segment Standings
        </h2>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {segments.map((segment, index) => {
          const isExpanded = expandedSegments.has(segment.id);
          const leader = segment.efforts[0];

          return (
            <div key={segment.id} className="overflow-hidden">
              <button
                onClick={() => toggleSegment(segment.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      {segment.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>📏 {(segment.distance / 1000).toFixed(2)} km</span>
                      <span>⛰️ {segment.averageGrade.toFixed(1)}%</span>
                      <span>👥 {segment.efforts.length} efforts</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {leader && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Leader</div>
                      <div className="font-bold text-orange-500">
                        🥇 {leader.userName} - {formatTime(leader.time)}
                      </div>
                    </div>
                  )}
                  <span
                    className={`text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 pb-4">
                  {segment.efforts.length === 0 ? (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No efforts recorded yet
                    </p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="text-sm text-gray-500 dark:text-gray-400">
                          <th className="py-2 px-2 text-left">#</th>
                          <th className="py-2 px-2 text-left">Athlete</th>
                          <th className="py-2 px-2 text-right">Time</th>
                          <th className="py-2 px-2 text-right">Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {segment.efforts.map((effort, effortIndex) => {
                          const gap = effortIndex > 0 ? effort.time - segment.efforts[0].time : 0;
                          return (
                            <tr
                              key={effort.userId}
                              className={`border-t border-gray-200 dark:border-gray-700 ${
                                effortIndex < 3 ? "bg-orange-50/50 dark:bg-orange-900/10" : ""
                              }`}
                            >
                              <td className="py-2 px-2 font-medium">
                                {getMedalEmoji(effortIndex + 1)} {effortIndex + 1}
                              </td>
                              <td className="py-2 px-2 text-gray-800 dark:text-gray-100">
                                {effort.userName}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-gray-800 dark:text-gray-100">
                                {formatTime(effort.time)}
                              </td>
                              <td className="py-2 px-2 text-right text-sm text-gray-500 dark:text-gray-400">
                                {gap > 0 ? `+${formatTime(gap)}` : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
