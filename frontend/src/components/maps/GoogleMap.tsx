/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useCallback, useState } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

let isLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (isLoaded && window.google?.maps?.Map) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      console.warn("Google Maps API key not configured. Using Interactive Canvas Map Fallback.");
      reject(new Error("API_KEY_MISSING"));
      return;
    }

    if (window.google?.maps?.Map) {
      isLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry,visualization&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.Map) {
        isLoaded = true;
        resolve();
      } else {
        reject(new Error("GOOGLE_MAPS_NOT_AVAILABLE"));
      }
    };
    script.onerror = () => reject(new Error("SCRIPT_LOAD_ERROR"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: "victim" | "camp" | "volunteer" | "hospital" | "flood" | "user";
  title: string;
  info?: string;
  onClick?: () => void;
}

export interface RouteInfo {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  color?: string;
  travelMode?: "DRIVING" | "WALKING";
}

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  routes?: RouteInfo[];
  breadcrumbs?: Array<{ lat: number; lng: number }>;
  floodZones?: Array<{ coordinates: Array<{ lat: number; lng: number }>; severity: string }>;
  onMapClick?: (lat: number, lng: number) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  onRouteCalculated?: (info: { distance: string; duration: string; steps: string[] }) => void;
  className?: string;
  showTraffic?: boolean;
  showHeatmap?: boolean;
  style?: React.CSSProperties;
}

const MARKER_ICONS: Record<MapMarker["type"], string> = {
  victim: "🔴",
  camp: "🟢",
  volunteer: "🔵",
  hospital: "🟡",
  flood: "⚫",
  user: "📍",
};

const MARKER_COLORS: Record<MapMarker["type"], string> = {
  victim: "#ef4444",
  camp: "#22c55e",
  volunteer: "#3b82f6",
  hospital: "#eab308",
  flood: "#374151",
  user: "#8b5cf6",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "#fbbf24",
  medium: "#f97316",
  high: "#ef4444",
  critical: "#7c3aed",
};

export function GoogleMap({
  center = { lat: 11.1271, lng: 78.6569 }, // Tamil Nadu center
  zoom = 7,
  markers = [],
  routes = [],
  breadcrumbs = [],
  floodZones = [],
  onMapClick,
  onMapLoad,
  onRouteCalculated,
  className,
  showTraffic = false,
  showHeatmap = false,
  style,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<Map<string, google.maps.Marker>>(new Map());
  const directionsRenderers = useRef<google.maps.DirectionsRenderer[]>([]);
  const breadcrumbPolyline = useRef<google.maps.Polyline | null>(null);
  const polygons = useRef<google.maps.Polygon[]>([]);
  const [apiLoaded, setApiLoaded] = useState(isLoaded);
  const [loadError, setLoadError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    if (window.google?.maps?.Map) {
      setApiLoaded(true);
      return;
    }
    loadGoogleMaps()
      .then(() => setApiLoaded(true))
      .catch((err) => {
        console.warn("Using interactive fallback map:", err?.message || err);
        setLoadError(true);
        setUseFallback(true);
      });
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.panTo(center);
    }
  }, [center]);

  // Initialize map safely
  useEffect(() => {
    if (useFallback) return;
    if (!apiLoaded || !containerRef.current || mapRef.current) return;
    if (!window.google?.maps?.Map || typeof window.google.maps.Map !== "function") {
      setUseFallback(true);
      return;
    }

    try {
      const map = new google.maps.Map(containerRef.current, {
        center,
        zoom,
        mapTypeId: "roadmap",
        styles: getMapStyles(),
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });

      mapRef.current = map;
      onMapLoad?.(map);

      if (onMapClick) {
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng());
          }
        });
      }

      if (showTraffic) {
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
      }
    } catch (e) {
      console.warn("Error creating google.maps.Map, switching to fallback:", e);
      setUseFallback(true);
    }
  }, [apiLoaded, useFallback]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const currentIds = new Set(markers.map((m) => m.id));

    // Remove stale markers
    markerRefs.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markerRefs.current.delete(id);
      }
    });

    // Add/update markers
    markers.forEach((m) => {
      const position = { lat: m.lat, lng: m.lng };

      if (markerRefs.current.has(m.id)) {
        markerRefs.current.get(m.id)!.setPosition(position);
        return;
      }

      const marker = new google.maps.Marker({
        position,
        map: mapRef.current!,
        title: m.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: m.type === "victim" ? 14 : 12,
          fillColor: MARKER_COLORS[m.type],
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
        },
        animation: m.type === "victim" ? google.maps.Animation.BOUNCE : undefined,
      });

      if (m.info || m.title) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding:6px 10px; font-family:sans-serif; color:#1e293b;">
              <strong style="font-size:13px; color:#0f172a;">${MARKER_ICONS[m.type] || "📍"} ${m.title}</strong>
              ${m.info ? `<p style="margin:4px 0 0; font-size:11px; color:#475569;">${m.info}</p>` : ""}
            </div>
          `,
        });
        marker.addListener("click", () => {
          infoWindow.open(mapRef.current, marker);
          m.onClick?.();
        });
      }

      markerRefs.current.set(m.id, marker);
    });
  }, [markers, useFallback]);

  // Update Google map routes
  useEffect(() => {
    if (useFallback || !mapRef.current || !window.google?.maps?.DirectionsService) return;

    // Clear old directions
    directionsRenderers.current.forEach((r) => r.setMap(null));
    directionsRenderers.current = [];

    if (routes.length === 0) return;

    const ds = new google.maps.DirectionsService();

    routes.forEach((rt) => {
      const dr = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: rt.color || "#3b82f6",
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });

      directionsRenderers.current.push(dr);

      ds.route(
        {
          origin: rt.origin,
          destination: rt.destination,
          travelMode: rt.travelMode === "WALKING" ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            dr.setDirections(result);
            const routeLeg = result.routes[0]?.legs[0];
            if (routeLeg && onRouteCalculated) {
              onRouteCalculated({
                distance: routeLeg.distance?.text || "",
                duration: routeLeg.duration?.text || "",
                steps: routeLeg.steps.map((s) => s.instructions.replace(/<[^>]*>/g, "")),
              });
            }
          }
        }
      );
    });
  }, [routes, onRouteCalculated]);

  // Draw breadcrumb trail
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    if (breadcrumbPolyline.current) {
      breadcrumbPolyline.current.setMap(null);
      breadcrumbPolyline.current = null;
    }

    if (breadcrumbs && breadcrumbs.length > 1) {
      breadcrumbPolyline.current = new google.maps.Polyline({
        path: breadcrumbs,
        geodesic: true,
        strokeColor: "#ef4444",
        strokeOpacity: 0.75,
        strokeWeight: 3.5,
        icons: [{
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2.5, strokeColor: "#ef4444" },
          offset: "100%",
          repeat: "50px"
        }],
        map: mapRef.current!,
      });
    }
  }, [breadcrumbs]);

  // Draw flood zones
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    polygons.current.forEach((p) => p.setMap(null));
    polygons.current = [];

    floodZones.forEach((zone) => {
      const polygon = new google.maps.Polygon({
        paths: zone.coordinates,
        strokeColor: SEVERITY_COLORS[zone.severity] || "#ef4444",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: SEVERITY_COLORS[zone.severity] || "#ef4444",
        fillOpacity: 0.15,
        map: mapRef.current!,
      });
      polygons.current.push(polygon);
    });
  }, [floodZones]);

  if (useFallback || loadError) {
    return (
      <InteractiveFallbackMap
        center={center}
        markers={markers}
        routes={routes}
        onMapClick={onMapClick}
        className={className}
        style={style}
      />
    );
  }

  if (!apiLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl animate-pulse ${className || ""}`}
        style={{ ...style, minHeight: "350px" }}
      >
        <div className="text-center">
          <div className="text-2xl animate-spin mb-2">🌍</div>
          <p className="text-sm text-slate-400">Loading map system…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full rounded-2xl overflow-hidden shadow-card border border-border ${className || ""}`}
      style={{ ...style, minHeight: "350px" }}
    />
  );
}

// ============================================================================
// INTERACTIVE FALLBACK CANVAS/SVG MAP (Used when Google API Key is unavailable)
// ============================================================================
function InteractiveFallbackMap({
  center,
  markers = [],
  routes = [],
  onMapClick,
  className,
  style,
}: {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  routes: RouteInfo[];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Map coordinates projection bounds (covering Tamil Nadu & surrounds)
  const minLat = 8.0;
  const maxLat = 13.5;
  const minLng = 76.0;
  const maxLng = 80.5;

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const centerPos = project(center.lat, center.lng);

  return (
    <div
      className={`relative w-full h-full min-h-[380px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden select-none flex flex-col ${className || ""}`}
      style={style}
    >
      {/* Map Header / Status Bar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-bold text-slate-200">Interactive GIS Disaster Map</span>
        <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full font-mono">Live Navigation</span>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.min(z + 0.3, 2.5))}
          className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-bold hover:bg-slate-800 flex items-center justify-center shadow-lg"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.max(z - 0.3, 0.8))}
          className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-bold hover:bg-slate-800 flex items-center justify-center shadow-lg"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* SVG Canvas */}
      <div
        className="w-full h-full flex-1 relative cursor-crosshair overflow-hidden"
        onClick={(e) => {
          if (!onMapClick) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = (e.clientX - rect.left) / rect.width;
          const clickY = (e.clientY - rect.top) / rect.height;
          const lat = maxLat - clickY * (maxLat - minLat);
          const lng = minLng + clickX * (maxLng - minLng);
          onMapClick(lat, lng);
        }}
      >
        <svg
          className="w-full h-full absolute inset-0"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: `${centerPos.x}% ${centerPos.y}%`, transition: "transform 0.2s ease" }}
        >
          {/* Grid Pattern */}
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.3)" strokeWidth="1" />
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="#090d16" />
          <rect width="100%" height="100%" fill="url(#gridPattern)" />

          {/* Simplified Coastline Outline for TN */}
          <path
            d="M 15 20 Q 30 40 45 60 Q 60 75 75 90 L 90 95 L 95 85 Q 85 50 65 30 Q 45 15 15 20 Z"
            fill="rgba(14, 165, 233, 0.05)"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Route Lines */}
          {routes.map((rt, idx) => {
            const orig = project(rt.origin.lat, rt.origin.lng);
            const dest = project(rt.destination.lat, rt.destination.lng);
            return (
              <g key={`route-${idx}`}>
                <line
                  x1={`${orig.x}%`}
                  y1={`${orig.y}%`}
                  x2={`${dest.x}%`}
                  y2={`${dest.y}%`}
                  stroke={rt.color || "url(#routeGradient)"}
                  strokeWidth="4"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
                <circle cx={`${orig.x}%`} cy={`${orig.y}%`} r="6" fill="#38bdf8" />
                <circle cx={`${dest.x}%`} cy={`${dest.y}%`} r="6" fill="#22c55e" />
              </g>
            );
          })}
        </svg>

        {/* HTML Markers */}
        <div
          className="w-full h-full absolute inset-0 pointer-events-none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: `${centerPos.x}% ${centerPos.y}%`, transition: "transform 0.2s ease" }}
        >
          {markers.map((m) => {
            const pos = project(m.lat, m.lng);
            const color = MARKER_COLORS[m.type] || "#3b82f6";
            const icon = MARKER_ICONS[m.type] || "📍";
            const isSelected = selectedMarker?.id === m.id;

            return (
              <div
                key={m.id}
                className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 z-10"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarker(m);
                  m.onClick?.();
                }}
              >
                <div className="relative flex flex-col items-center group cursor-pointer">
                  {/* Ping Animation for Victims & SOS */}
                  {(m.type === "victim" || m.type === "user") && (
                    <span className="absolute w-8 h-8 rounded-full bg-red-500/40 animate-ping" />
                  )}

                  {/* Marker Pin Icon */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs"
                    style={{ backgroundColor: color }}
                  >
                    <span>{icon}</span>
                  </div>

                  {/* Label */}
                  <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-[10px] font-bold text-slate-200 whitespace-nowrap shadow-md">
                    {m.title}
                  </div>

                  {/* Active Tooltip Popover */}
                  {isSelected && (
                    <div className="absolute bottom-full mb-2 w-48 p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs z-30 pointer-events-auto">
                      <div className="flex justify-between items-start font-bold text-slate-100 mb-1">
                        <span>{icon} {m.title}</span>
                        <button
                          type="button"
                          onClick={(ev) => { ev.stopPropagation(); setSelectedMarker(null); }}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      {m.info && <p className="text-[11px] text-slate-300 leading-tight">{m.info}</p>}
                      <div className="mt-2 text-[10px] text-slate-500 font-mono">
                        GPS: {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Legend */}
      <div className="p-2.5 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-2 z-20">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Stranded Victim</span>
          <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Relief Camp</span>
          <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Rescue Volunteer</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">GIS System Online</span>
      </div>
    </div>
  );
}

function getMapStyles(): google.maps.MapTypeStyle[] {
  return [
    { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f8ff" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#a8c8f0" }] },
    { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d1d8e8" }] },
    { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#f0f4ff" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#cdebd4" }] },
    { featureType: "poi.medical", elementType: "geometry", stylers: [{ color: "#ffd8d8" }] },
    { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#94a3b8" }] },
  ];
}

// Hook to get current GPS position
export function useGeolocation() {
  const [position, setPosition] = React.useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [accuracy, setAccuracy] = React.useState<number | null>(null);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setPosition({ lat: 11.494867, lng: 77.278934 });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let resolved = false;

    // Safety 3.5s timeout if browser GPS hangs
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("Geolocation timed out, using fallback coordinates.");
        setPosition((prev) => prev || { lat: 11.494867, lng: 77.278934 });
        setLoading(false);
      }
    }, 3500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimer);
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy);
          setLoading(false);
        }
      },
      (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimer);
          setError(err.message);
          setPosition({ lat: 11.494867, lng: 77.278934 });
          setLoading(false);
        }
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
    );
  }, []);

  const watchPosition = useCallback((callback: (pos: { lat: number; lng: number }) => void) => {
    if (!navigator.geolocation) return () => {};

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(coords);
        setAccuracy(pos.coords.accuracy);
        callback(coords);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { position, error, loading, accuracy, getPosition, watchPosition };
}

// Reverse geocode using Google Maps Geocoding API
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  try {
    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await resp.json();
    if (data.results?.[0]) {
      return data.results[0].formatted_address;
    }
  } catch {}
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Calculate distance between two points (Haversine formula)
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
