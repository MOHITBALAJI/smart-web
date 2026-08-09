import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const GOOGLE_MAPS_API_BASE = 'https://maps.googleapis.com/maps/api';

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getApiKey(res: Response): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'Google Maps API key not configured' });
    return null;
  }
  return key;
}

// ---------------------------------------------------------------------------
// GET /api/maps/geocode?lat=&lng= — Reverse geocode to address
// ---------------------------------------------------------------------------
router.get('/geocode', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = getApiKey(res);
    if (!apiKey) return;

    const { lat, lng } = req.query as Record<string, string>;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng query parameters are required' });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      res.status(400).json({ error: 'lat and lng must be valid numbers' });
      return;
    }

    const url = `${GOOGLE_MAPS_API_BASE}/geocode/json?latlng=${latNum},${lngNum}&key=${apiKey}`;
    const response = await fetch(url);
    const json = await response.json() as {
      status: string;
      results: Array<{ formatted_address: string; address_components: unknown[] }>;
      error_message?: string;
    };

    if (json.status !== 'OK') {
      res.status(502).json({
        error: 'Geocoding failed',
        status: json.status,
        details: json.error_message,
      });
      return;
    }

    const formatted = json.results[0]?.formatted_address || 'Unknown location';
    const components = json.results[0]?.address_components || [];

    res.json({
      lat: latNum,
      lng: lngNum,
      formatted_address: formatted,
      address_components: components,
      raw_results: json.results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Geocoding error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/maps/nearest-camp?lat=&lng= — Find nearest active relief camp
// ---------------------------------------------------------------------------
router.get('/nearest-camp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query as Record<string, string>;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng query parameters are required' });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      res.status(400).json({ error: 'lat and lng must be valid numbers' });
      return;
    }

    const { data: camps, error } = await supabase
      .from('relief_camps')
      .select('id, name, address, latitude, longitude, status, max_capacity, current_occupancy, contact_phone')
      .eq('status', 'active');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!camps || camps.length === 0) {
      res.status(404).json({ error: 'No active camps found' });
      return;
    }

    // Sort all camps by distance and return top 5
    const campsWithDistance = camps
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => ({
        ...c,
        distance_km: haversineKm(latNum, lngNum, Number(c.latitude), Number(c.longitude)),
        available_beds: Math.max(0, c.max_capacity - c.current_occupancy),
      }))
      .sort((a, b) => a.distance_km - b.distance_km);

    const nearest = campsWithDistance[0];
    const nearby = campsWithDistance.slice(0, 5);

    res.json({
      nearest,
      nearby,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/maps/nearest-volunteer?lat=&lng= — Find nearest available volunteer
// ---------------------------------------------------------------------------
router.get('/nearest-volunteer', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query as Record<string, string>;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng query parameters are required' });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      res.status(400).json({ error: 'lat and lng must be valid numbers' });
      return;
    }

    const { data: volunteers, error } = await supabase
      .from('volunteers')
      .select('id, current_lat, current_lng, users:user_id(full_name, phone, email)')
      .eq('is_available', true);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!volunteers || volunteers.length === 0) {
      res.status(404).json({ error: 'No available volunteers found' });
      return;
    }

    const volunteersWithDistance = volunteers
      .filter((v) => v.current_lat != null && v.current_lng != null)
      .map((v) => ({
        ...v,
        distance_km: haversineKm(latNum, lngNum, Number(v.current_lat), Number(v.current_lng)),
      }))
      .sort((a, b) => a.distance_km - b.distance_km);

    const nearest = volunteersWithDistance[0] || null;
    const nearby = volunteersWithDistance.slice(0, 5);

    if (!nearest) {
      res.status(404).json({ error: 'No volunteers with location data found' });
      return;
    }

    res.json({ nearest, nearby });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/maps/directions — Get route info between two points
// ---------------------------------------------------------------------------
router.get('/directions', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = getApiKey(res);
    if (!apiKey) return;

    const { origin_lat, origin_lng, dest_lat, dest_lng, mode = 'driving' } =
      req.query as Record<string, string>;

    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      res.status(400).json({
        error: 'origin_lat, origin_lng, dest_lat, and dest_lng are all required',
      });
      return;
    }

    const oLat = parseFloat(origin_lat);
    const oLng = parseFloat(origin_lng);
    const dLat = parseFloat(dest_lat);
    const dLng = parseFloat(dest_lng);

    if ([oLat, oLng, dLat, dLng].some(isNaN)) {
      res.status(400).json({ error: 'All coordinate values must be valid numbers' });
      return;
    }

    const validModes = ['driving', 'walking', 'bicycling', 'transit'];
    const travelMode = validModes.includes(mode) ? mode : 'driving';

    const url =
      `${GOOGLE_MAPS_API_BASE}/directions/json` +
      `?origin=${oLat},${oLng}` +
      `&destination=${dLat},${dLng}` +
      `&mode=${travelMode}` +
      `&key=${apiKey}`;

    const response = await fetch(url);
    const json = await response.json() as {
      status: string;
      routes: Array<{
        legs: Array<{
          distance: { text: string; value: number };
          duration: { text: string; value: number };
          steps: unknown[];
        }>;
        overview_polyline: { points: string };
        summary: string;
      }>;
      error_message?: string;
    };

    if (json.status !== 'OK') {
      res.status(502).json({
        error: 'Directions request failed',
        status: json.status,
        details: json.error_message,
      });
      return;
    }

    const route = json.routes[0];
    const leg = route?.legs[0];

    res.json({
      origin: { lat: oLat, lng: oLng },
      destination: { lat: dLat, lng: dLng },
      mode: travelMode,
      distance: leg?.distance,
      duration: leg?.duration,
      summary: route?.summary,
      polyline: route?.overview_polyline?.points,
      steps: leg?.steps,
      full_route: json.routes,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Directions error';
    res.status(500).json({ error: message });
  }
});

export default router;
