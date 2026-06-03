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

interface SPPGLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  operating_hours_start?: string;
  operating_hours_end?: string;
}

interface SPPGMapViewProps {
  locations: SPPGLocation[];
  height?: string;
  className?: string;
}

export default function SPPGMapView({
  locations,
  height = "500px",
  className = "",
}: SPPGMapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setIsClient(true);

    // Fix for Leaflet default icons
    if (typeof window !== "undefined") {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    }
  }, []);

  // Force re-render when locations change
  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [locations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any existing map instances
      if (typeof window !== "undefined") {
        const mapContainers = document.querySelectorAll('.leaflet-container');
        mapContainers.forEach(container => {
          if ((container as any)._leaflet_id) {
            (container as any)._leaflet_id = null;
          }
        });
      }
    };
  }, []);

  const createCustomIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background: #10b981;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 2px solid white;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      className: "custom-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  };

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
            Tidak ada lokasi SPPG untuk ditampilkan
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
        zoom={11}
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
            icon={createCustomIcon()}
          >
            <Popup>
              <div className="p-3 min-w-[250px]">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                  {location.name}
                </h3>
                <p className="text-xs text-gray-600 mb-2">{location.address}</p>
                {location.phone && (
                  <p className="text-xs text-blue-600 mb-1">
                    📞 {location.phone}
                  </p>
                )}
                {location.operating_hours_start &&
                  location.operating_hours_end && (
                    <p className="text-xs text-gray-500 mb-2">
                      🕒 {location.operating_hours_start} -{" "}
                      {location.operating_hours_end}
                    </p>
                  )}
                <div className="mt-2 text-xs text-gray-400">
                  <p>
                    Koordinat: {location.latitude.toFixed(6)},{" "}
                    {location.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
