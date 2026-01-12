"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: "selected-marker",
});

L.Marker.prototype.options.icon = defaultIcon;

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

interface SegmentMapProps {
  center: [number, number];
  segments: Segment[];
  selectedSegment: Segment | null;
  onBoundsChange: (bounds: {
    sw_lat: number;
    sw_lng: number;
    ne_lat: number;
    ne_lng: number;
  }) => void;
  onSegmentSelect: (segment: Segment) => void;
}

// Component to handle map events
function MapEventHandler({
  onBoundsChange,
}: {
  onBoundsChange: SegmentMapProps["onBoundsChange"];
}) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        sw_lat: bounds.getSouthWest().lat,
        sw_lng: bounds.getSouthWest().lng,
        ne_lat: bounds.getNorthEast().lat,
        ne_lng: bounds.getNorthEast().lng,
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        sw_lat: bounds.getSouthWest().lat,
        sw_lng: bounds.getSouthWest().lng,
        ne_lat: bounds.getNorthEast().lat,
        ne_lng: bounds.getNorthEast().lng,
      });
    },
  });

  // Trigger initial bounds fetch
  useEffect(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      sw_lat: bounds.getSouthWest().lat,
      sw_lng: bounds.getSouthWest().lng,
      ne_lat: bounds.getNorthEast().lat,
      ne_lng: bounds.getNorthEast().lng,
    });
  }, [map, onBoundsChange]);

  return null;
}

// Component to fly to selected segment
function FlyToSegment({ segment }: { segment: Segment | null }) {
  const map = useMap();
  const prevSegmentRef = useRef<Segment | null>(null);

  useEffect(() => {
    if (segment?.start_latlng && segment !== prevSegmentRef.current) {
      map.flyTo(segment.start_latlng, 14, { duration: 0.5 });
      prevSegmentRef.current = segment;
    }
  }, [segment, map]);

  return null;
}

export default function SegmentMap({
  center,
  segments,
  selectedSegment,
  onBoundsChange,
  onSegmentSelect,
}: SegmentMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-[400px] w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventHandler onBoundsChange={onBoundsChange} />
      <FlyToSegment segment={selectedSegment} />

      {segments.map((segment) => {
        if (!segment.start_latlng) return null;
        const isSelected = selectedSegment?.id === segment.id;

        return (
          <Marker
            key={segment.id}
            position={segment.start_latlng}
            icon={isSelected ? selectedIcon : defaultIcon}
            eventHandlers={{
              click: () => onSegmentSelect(segment),
            }}
          >
            <Popup>
              <div className="font-sans">
                <h4 className="font-bold text-gray-800 mb-1">{segment.name}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Distance: {(segment.distance / 1000).toFixed(2)} km</p>
                  <p>Grade: {(segment.average_grade || segment.avg_grade || 0).toFixed(1)}%</p>
                  {segment.elev_difference && (
                    <p>Elevation: {segment.elev_difference.toFixed(0)}m</p>
                  )}
                </div>
                <button
                  onClick={() => onSegmentSelect(segment)}
                  className="mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded font-medium hover:bg-orange-600"
                >
                  Select
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
