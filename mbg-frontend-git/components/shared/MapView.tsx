"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import all Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface MapViewProps {
  latitude: number | null;
  longitude: number | null;
  title: string;
  description?: string;
  height?: string;
  className?: string;
}

export default function MapView({
  latitude,
  longitude,
  title,
  description,
  height = "400px",
  className = "",
}: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet only on client side
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Handle null coordinates
  if (latitude === null || longitude === null) {
    return (
      <div
        className={`rounded-xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Koordinat tidak tersedia</p>
        </div>
      </div>
    );
  }

  if (!isClient || !L) {
    return (
      <div
        className={`bg-gray-200 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Memuat peta...</p>
        </div>
      </div>
    );
  }

  // Use custom SVG marker from public folder
  const markerIcon = L.icon({
    iconUrl: "/map-pin.svg",
    iconRetinaUrl: "/map-pin.svg",
    iconSize: [42, 49],
    iconAnchor: [21, 49],
    popupAnchor: [0, -49]
  });

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-lg ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={markerIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                <p>
                  Koordinat: {latitude != null ? Number(latitude).toFixed(6) : 'N/A'}, {longitude != null ? Number(longitude).toFixed(6) : 'N/A'}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-3 px-3 py-1.5 text-xs font-medium bg-blue-600 rounded hover:bg-blue-700 no-underline"
                style={{ color: '#fff' }}
              >
                Buka di Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
