"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Dynamically import MapContainer to avoid SSR issues
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

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  type: string;
}

interface MultiMapViewProps {
  locations: Location[];
  height?: string;
  className?: string;
}

export default function MultiMapView({
  locations,
  height = "400px",
  className = "",
}: MultiMapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setIsClient(true);

    // No default icon override; we'll use our custom SVG marker below
  }, []);

  // Force re-render when locations change
  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [locations]);

  // Use custom SVG marker from public folder
  const markerIcon = L.icon({
    iconUrl: "/map-pin.svg",
    iconRetinaUrl: "/map-pin.svg",
    iconSize: [42, 49],
    iconAnchor: [21, 49],
    popupAnchor: [0, -49]
  });

  if (!isClient) {
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

  if (locations.length === 0) {
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
          <p className="text-gray-500 text-sm">
            Tidak ada lokasi untuk ditampilkan
          </p>
        </div>
      </div>
    );
  }

  // Calculate center point
  const centerLat =
    locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
  const centerLng =
    locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-lg ${className}`}
      style={{ height }}
    >
      <MapContainer
        key={mapKey}
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={21}
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
        />
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {location.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                {location.phone && (
                  <p className="text-sm text-blue-600 mb-1">{location.phone}</p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  <p>
                    Koordinat: {location.latitude.toFixed(6)},{" "}
                    {location.longitude.toFixed(6)}
                  </p>
                  <p>Tipe: {location.type === "sppg" ? "SPPG" : "Sekolah"}</p>
                </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
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
        ))}
      </MapContainer>
    </div>
  );
}
