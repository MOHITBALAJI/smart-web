import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { sosRateLimit } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';

const router = Router();

// ---------------------------------------------------------------------------
// Haversine helper
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

// ---------------------------------------------------------------------------
// Auto-find nearest camp helper (relief_camps table)
// ---------------------------------------------------------------------------
async function findNearestCamp(
  lat: number,
  lng: number
): Promise<{ id: string; name: string; distance_km: number } | null> {
  const { data: camps, error } = await supabase
    .from('relief_camps')
    .select('id, name, latitude, longitude, status')
    .eq('status', 'active');

  if (error || !camps || camps.length === 0) return null;

  let nearest: { id: string; name: string; distance_km: number } | null = null;

  for (const camp of camps) {
    if (camp.latitude == null || camp.longitude == null) continue;
    const d = haversineKm(lat, lng, Number(camp.latitude), Number(camp.longitude));
    if (!nearest || d < nearest.distance_km) {
      nearest = { id: camp.id, name: camp.name, distance_km: d };
    }
  }

  return nearest;
}

// ---------------------------------------------------------------------------
// POST /api/sos — Create SOS request
// ---------------------------------------------------------------------------
router.post(
  '/',
  sosRateLimit,
  validateBody({
    lat: { type: 'number', required: true, min: -90, max: 90 },
    lng: { type: 'number', required: true, min: -180, max: 180 },
    emergency_type: {
      type: 'string',
      required: true,
      enum: ['flood_rescue', 'medical', 'stranded', 'missing_person', 'structural_damage', 'other'],
    },
    severity_level: {
      type: 'string',
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
    },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        lat,
        lng,
        address,
        emergency_type,
        severity_level,
        description,
        victim_name,
        victim_phone,
        accuracy,
        battery_level,
      } = req.body as {
        lat: number;
        lng: number;
        address?: string;
        emergency_type: string;
        severity_level: string;
        description?: string;
        victim_name?: string;
        victim_phone?: string;
        accuracy?: number;
        battery_level?: number;
      };

      // Try to get user id from auth header (optional auth)
      let userId: string | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const { data: { user } } = await supabaseAdmin.auth.getUser(token);
          if (user) userId = user.id;
        } catch {}
      }

      // Map userId to beneficiaryId if user exists
      let beneficiaryId: string | null = null;
      if (userId) {
        const { data: ben } = await supabase
          .from('beneficiaries')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        if (ben) beneficiaryId = ben.id;
      }

      // Map severity_level to emergency_level (1-5)
      let emergency_level = 3;
      if (severity_level === 'low') emergency_level = 1;
      else if (severity_level === 'medium') emergency_level = 3;
      else if (severity_level === 'high') emergency_level = 4;
      else if (severity_level === 'critical') emergency_level = 5;

      // Find nearest camp (for informational logging in notifications, does not map to sos_requests column directly)
      const nearestCamp = await findNearestCamp(lat, lng);

      // Insert SOS record
      const { data: sos, error } = await supabase
        .from('sos_requests')
        .insert({
          beneficiary_id: beneficiaryId,
          reporter_name: victim_name || 'Anonymous',
          reporter_phone: victim_phone || null,
          latitude: lat,
          longitude: lng,
          address: address || null,
          accuracy: accuracy || null,
          emergency_type,
          emergency_level,
          description: description || null,
          battery_level: battery_level || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      // Insert victim locations breadcrumb
      await supabase.from('victim_locations').insert({
        sos_request_id: sos.id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy || null,
        recorded_at: new Date().toISOString(),
      });

      // Trigger notification to admins (broadcast to all by leaving user_id as null)
      await supabase.from('notifications').insert({
        title: `🚨 New SOS: ${emergency_type.replace('_', ' ')} (Level ${emergency_level})`,
        message: `SOS request from ${sos.reporter_name} at ${sos.address || 'GPS Coordinates'}. ${nearestCamp ? `Nearest camp: ${nearestCamp.name} (${nearestCamp.distance_km.toFixed(2)} km)` : ''}`,
        type: 'sos_alert',
        is_read: false,
        data: {
          sos_id: sos.id,
          reference_id: sos.id,
          reference_type: 'sos_request',
        },
        created_at: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        sos,
        nearest_camp: nearestCamp,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/sos — List SOS requests (admin/volunteer only)
// ---------------------------------------------------------------------------
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'volunteer'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, date_from, date_to, page = '1', limit = '20' } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('sos_requests')
        .select('*, volunteers:assigned_volunteer_id(id, users:user_id(full_name, phone))', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (status) query = query.eq('status', status);
      if (date_from) query = query.gte('created_at', date_from);
      if (date_to) query = query.lte('created_at', date_to);

      const { data, error, count } = await query;

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count ?? 0,
          pages: Math.ceil((count ?? 0) / limitNum),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/sos/:id — Get single SOS with full details
// ---------------------------------------------------------------------------
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('sos_requests')
      .select(`
        *,
        beneficiary:beneficiary_id(
          id, user_id, blood_group, current_camp_id, shelter_status,
          users:user_id(full_name, phone)
        ),
        assignments:volunteer_assignments(
          id, status, assigned_at, completed_at,
          volunteer:volunteer_id(id, user_id, vehicle_type, users:user_id(full_name, phone))
        ),
        locations:victim_locations(id, latitude, longitude, accuracy, recorded_at)
      `)
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ error: 'SOS request not found' });
      return;
    }

    // Verify authorized user
    if (req.user?.role !== 'admin' && req.user?.role !== 'volunteer') {
      const isOwner = data.beneficiary?.user_id === req.user?.id;
      if (!isOwner) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/sos/:id/status — Update SOS status
// ---------------------------------------------------------------------------
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin', 'volunteer'),
  validateBody({
    status: {
      type: 'string',
      required: true,
      enum: ['pending', 'assigned', 'in_progress', 'rescued', 'cancelled'],
    },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: string };

      const { data, error } = await supabase
        .from('sos_requests')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          beneficiary:beneficiary_id(user_id)
        `)
        .single();

      if (error) {
        res.status(404).json({ error: 'SOS request not found or update failed' });
        return;
      }

      // Notify the victim if they have an active user account
      const userProfile = data.beneficiary as { user_id: string } | null;
      if (userProfile?.user_id) {
        await supabase.from('notifications').insert({
          user_id: userProfile.user_id,
          title: `Rescue Update: ${status.toUpperCase()}`,
          message: `Your emergency SOS request status is now: ${status.replace('_', ' ')}`,
          type: 'rescue_update',
          is_read: false,
          data: {
            sos_id: id,
            reference_id: id,
            reference_type: 'sos_request',
          },
          created_at: new Date().toISOString(),
        });
      }

      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/sos/:id/location — Get victim's latest location
// ---------------------------------------------------------------------------
router.get('/:id/location', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('victim_locations')
      .select('*')
      .eq('sos_request_id', id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback: return initial coordinate from sos_requests
      const { data: sos, error: sosError } = await supabase
        .from('sos_requests')
        .select('latitude, longitude, created_at')
        .eq('id', id)
        .single();

      if (sosError) {
        res.status(404).json({ error: 'SOS request location not found' });
        return;
      }
      res.json({ lat: Number(sos.latitude), lng: Number(sos.longitude), updated_at: sos.created_at, source: 'initial' });
      return;
    }

    res.json({
      lat: Number(data.latitude),
      lng: Number(data.longitude),
      accuracy: data.accuracy,
      updated_at: data.recorded_at,
      source: 'live',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/sos/:id/location — Update victim location
// ---------------------------------------------------------------------------
router.post(
  '/:id/location',
  sosRateLimit,
  validateBody({
    lat: { type: 'number', required: true, min: -90, max: 90 },
    lng: { type: 'number', required: true, min: -180, max: 180 },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { lat, lng, accuracy } = req.body as { lat: number; lng: number; accuracy?: number };

      // Verify SOS request exists
      const { error: sosError } = await supabase
        .from('sos_requests')
        .select('id')
        .eq('id', id)
        .single();

      if (sosError) {
        res.status(404).json({ error: 'SOS request not found' });
        return;
      }

      const { data, error } = await supabase
        .from('victim_locations')
        .insert({
          sos_request_id: id,
          latitude: lat,
          longitude: lng,
          accuracy: accuracy || null,
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(201).json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

export default router;
