"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import("./SegmentMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

interface Segment {
  id: number;
  name: string;
  distance: number;
  avg_grade: number;
  average_grade?: number;
  elev_difference?: number;
  climb_category?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
}

export function SegmentSearch({ raceSlug }: { raceSlug: string }) {
  const router = useRouter();
  const [segmentId, setSegmentId] = useState("");
  const [textSearch, setTextSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchingMap, setSearchingMap] = useState(false);
  const [error, setError] = useState("");
  const [segment, setSegment] = useState<Segment | null>(null);
  const [mapSegments, setMapSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to SF
  const [activeTab, setActiveTab] = useState<"map" | "id">("map");

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Default to SF if location denied
        }
      );
    }
  }, []);

  // Search segments by map bounds
  const handleMapSearch = useCallback(async (bounds: {
    sw_lat: number;
    sw_lng: number;
    ne_lat: number;
    ne_lng: number;
  }) => {
    setSearchingMap(true);
    setError("");

    try {
      const params = new URLSearchParams({
        sw_lat: bounds.sw_lat.toString(),
        sw_lng: bounds.sw_lng.toString(),
        ne_lat: bounds.ne_lat.toString(),
        ne_lng: bounds.ne_lng.toString(),
      });
      const res = await fetch(`/api/strava/segments?${params}`);
      if (!res.ok) throw new Error("Failed to search segments");
      const data = await res.json();
      setMapSegments(data.segments || data || []);
    } catch {
      setError("Could not search this area. Try zooming in.");
      setMapSegments([]);
    } finally {
      setSearchingMap(false);
    }
  }, []);

  // Search by segment ID
  async function handleIdSearch(e: React.FormEvent) {
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

  // Add segment to race
  async function handleAdd(segmentToAdd: Segment) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/races/${raceSlug}/segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId: segmentToAdd.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add segment");
      }

      // Remove from list and clear selection
      setMapSegments((prev) => prev.filter((s) => s.id !== segmentToAdd.id));
      setSelectedSegment(null);
      setSegment(null);
      setSegmentId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add segment");
    } finally {
      setLoading(false);
    }
  }

  // Filter segments by text search
  const filteredSegments = mapSegments.filter((s) =>
    s.name.toLowerCase().includes(textSearch.toLowerCase())
  );

  // Get climb category emoji
  function getClimbEmoji(category?: number) {
    if (!category || category === 0) return "🚴";
    if (category === 5) return "⬆️";
    if (category === 4) return "🔺";
    if (category === 3) return "⛰️";
    if (category === 2) return "🏔️";
    if (category === 1) return "👑";
    return "🚴";
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span>🔍</span> Add Segments
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Search the map or enter a segment ID to add segments to your race
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "map"
              ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          🗺️ Search Map
        </button>
        <button
          onClick={() => setActiveTab("id")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "id"
              ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          🔢 By Segment ID
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
          <span>😕</span> {error}
        </div>
      )}

      {/* Map Search Tab */}
      {activeTab === "map" && (
        <div className="p-6">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4">
            <MapComponent
              center={mapCenter}
              segments={filteredSegments}
              selectedSegment={selectedSegment}
              onBoundsChange={handleMapSearch}
              onSegmentSelect={setSelectedSegment}
            />
          </div>

          {/* Search filter */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                placeholder="Filter segments by name..."
                className="w-full px-4 py-3 pl-10 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-900 focus:border-orange-400 transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Loading indicator */}
          {searchingMap && (
            <div className="text-center py-4 text-gray-500">
              <span className="animate-spin inline-block mr-2">⏳</span>
              Searching segments in this area...
            </div>
          )}

          {/* Segments list */}
          {filteredSegments.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Found {filteredSegments.length} segment{filteredSegments.length !== 1 ? "s" : ""} in this area
              </p>
              {filteredSegments.map((seg) => (
                <div
                  key={seg.id}
                  onClick={() => setSelectedSegment(seg)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedSegment?.id === seg.id
                      ? "bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-400"
                      : "bg-gray-50 dark:bg-gray-900 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{getClimbEmoji(seg.climb_category)}</span>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100">
                          {seg.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>📏 {(seg.distance / 1000).toFixed(2)} km</span>
                        <span>⛰️ {(seg.average_grade || seg.avg_grade || 0).toFixed(1)}%</span>
                        {seg.elev_difference && (
                          <span>📈 {seg.elev_difference.toFixed(0)}m</span>
                        )}
                      </div>
                    </div>
                    {selectedSegment?.id === seg.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(seg);
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-bold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-sm"
                      >
                        {loading ? "..." : "➕ Add"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchingMap && filteredSegments.length === 0 && mapSegments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🗺️</div>
              <p>Pan and zoom the map to search for segments</p>
              <p className="text-sm mt-1">Segments will appear when you move the map</p>
            </div>
          )}
        </div>
      )}

      {/* ID Search Tab */}
      {activeTab === "id" && (
        <div className="p-6">
          <form onSubmit={handleIdSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              placeholder="Enter Strava segment ID (e.g., 229781)"
              className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-900 focus:border-orange-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !segmentId}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all"
            >
              {loading ? "..." : "🔍 Search"}
            </button>
          </form>

          {segment && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{segment.name}</h4>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    📏 {(segment.distance / 1000).toFixed(2)} km •
                    ⛰️ {(segment.average_grade || segment.avg_grade || 0).toFixed(1)}% avg grade
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(segment)}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading ? "..." : "➕ Add to Race"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span>💡</span>
              Find segment IDs in Strava URLs: strava.com/segments/<strong>12345</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
