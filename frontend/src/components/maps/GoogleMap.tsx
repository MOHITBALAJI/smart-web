/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useCallback, useState } from "react";
import type L_Type from "leaflet";

const DEFAULT_GOOGLE_MAPS_API_KEY = "AIzaSyDqcKOqiDT62U7BZ9EPAIckzEXtUdc5VFc";
const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || DEFAULT_GOOGLE_MAPS_API_KEY;

let isLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR_NO_WINDOW"));
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
  user: "#1a73e8",
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
  const polygons = useRef<(google.maps.Polygon | google.maps.Polyline)[]>([]);
  const [apiLoaded, setApiLoaded] = useState(isLoaded);
  const [loadError, setLoadError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    if (typeof window === "undefined") return;
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

    try {
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

        try {
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
              } else {
                // If Google Directions API is unactivated/denied, draw polyline fallback silently
                const fallbackPoly = new google.maps.Polyline({
                  path: [rt.origin, rt.destination],
                  geodesic: true,
                  strokeColor: rt.color || "#3b82f6",
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                  map: mapRef.current!,
                });
                polygons.current.push(fallbackPoly);
              }
            }
          );
        } catch {
          // Silent fallback for legacy/unactivated API
          const fallbackPoly = new google.maps.Polyline({
            path: [rt.origin, rt.destination],
            geodesic: true,
            strokeColor: rt.color || "#3b82f6",
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: mapRef.current!,
          });
          polygons.current.push(fallbackPoly);
        }
      });
    } catch {}
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
        zoom={zoom}
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
// REAL INTERACTIVE LEAFLET MAP TILE ENGINE (Loaded with OpenStreetMap real street map tiles & Google Maps Live Blue Dot)
// ============================================================================
function InteractiveFallbackMap({
  center,
  zoom = 13,
  markers = [],
  routes = [],
  onMapClick,
  className,
  style,
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  routes?: RouteInfo[];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L_Type.Map | null>(null);
  const markersRef = useRef<Map<string, L_Type.Marker>>(new Map());
  const [leaflet, setLeaflet] = useState<typeof L_Type | null>(null);

  // Dynamically load Leaflet only on client side (no SSR!)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      setLeaflet(L.default || L);
    });
  }, []);

  // Initialize Leaflet Interactive Map with Real Street Map Tiles
  useEffect(() => {
    if (!leaflet || !containerRef.current || mapRef.current) return;

    try {
      const map = leaflet.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // OpenStreetMap high-detail street map tiles!
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      if (onMapClick) {
        map.on("click", (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapRef.current = map;
    } catch (e) {
      console.warn("Leaflet map init error:", e);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leaflet]);

  // Pan & Zoom with smooth 1.5s Leaflet flyTo animation!
  useEffect(() => {
    if (!mapRef.current || !center || !leaflet) return;
    mapRef.current.flyTo([center.lat, center.lng], zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [center.lat, center.lng, zoom, leaflet]);

  // Update Markers with Google Maps Live Location Blue Dot!
  useEffect(() => {
    if (!mapRef.current || !leaflet) return;
    const map = mapRef.current;

    // Remove old markers
    const currentIds = new Set(markers.map((m) => m.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    markers.forEach((m) => {
      if (markersRef.current.has(m.id)) {
        markersRef.current.get(m.id)!.setLatLng([m.lat, m.lng]);
        return;
      }

      let icon: L_Type.DivIcon;
      if (m.type === "user") {
        // EXACT GOOGLE MAPS LIVE LOCATION BLUE DOT!
        icon = leaflet.divIcon({
          className: "google-maps-live-blue-dot",
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: translate(-10px, -10px);">
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(26, 115, 232, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(26, 115, 232, 0.35);"></div>
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #1a73e8; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.4); z-index: 10;"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      } else {
        icon = leaflet.divIcon({
          className: "custom-leaflet-marker",
          html: `<div style="background:${MARKER_COLORS[m.type] || '#3b82f6'}; width:24px; height:24px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; font-size:12px; shadow:0 2px 6px rgba(0,0,0,0.3);">${MARKER_ICONS[m.type] || '📍'}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      }

      const marker = leaflet.marker([m.lat, m.lng], { icon }).addTo(map);

      if (m.info || m.title) {
        marker.bindPopup(`
          <div style="padding:4px 8px; font-family:sans-serif; color:#0f172a;">
            <strong style="font-size:12px;">${m.title}</strong>
            ${m.info ? `<p style="margin:2px 0 0; font-size:11px; color:#475569;">${m.info}</p>` : ""}
          </div>
        `);
      }

      markersRef.current.set(m.id, marker);
    });
  }, [markers, leaflet]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[260px] rounded-xl overflow-hidden border border-slate-800 shadow-xl ${className || ""}`}
      style={style}
    />
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
