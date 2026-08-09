import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

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

// ---------------------------------------------------------------------------
// GET /api/volunteers — List volunteers (optionally filter by availability)
// ---------------------------------------------------------------------------
router.get('/', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { available, district, page = '1', limit = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('volunteers')
      .select('*, users:user_id(full_name, email, phone)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (available === 'true') query = query.eq('is_available', true);
    if (available === 'false') query = query.eq('is_available', false);
    if (district) query = query.eq('district_id', district);

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
});

// ---------------------------------------------------------------------------
// PATCH /api/volunteers/:id/status — Update volunteer availability
// ---------------------------------------------------------------------------
router.patch(
  '/:id/status',
  requireAuth,
  validateBody({
    is_available: { type: 'boolean', required: true },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { is_available } = req.body as {
        is_available: boolean;
      };

      // Volunteers can only update their own status; admins can update any
      const isSelf = req.user?.role !== 'admin';

      if (isSelf) {
        const { data: volunteer } = await supabase
          .from('volunteers')
          .select('user_id')
          .eq('id', id)
          .single();

        if (!volunteer || volunteer.user_id !== req.user?.id) {
          res.status(403).json({ error: 'Forbidden: cannot update another volunteer\'s status' });
          return;
        }
      }

      const { data, error } = await supabase
        .from('volunteers')
        .update({
          is_available,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        res.status(404).json({ error: 'Volunteer not found or update failed' });
        return;
      }

      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/volunteers/:id/assignments — Get volunteer's assignments
// ---------------------------------------------------------------------------
router.get('/:id/assignments', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.query as Record<string, string>;

    let query = supabase
      .from('volunteer_assignments')
      .select(`
        *,
        sos_request:sos_request_id(
          id, latitude, longitude, address, emergency_type, emergency_level, status,
          reporter_name, reporter_phone, created_at
        )
      `)
      .eq('volunteer_id', id)
      .order('assigned_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/volunteers/assign — Assign volunteer to SOS request
// ---------------------------------------------------------------------------
router.post(
  '/assign',
  requireAuth,
  requireRole('admin'),
  validateBody({
    sos_request_id: { type: 'string', required: true },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sos_request_id, preferred_volunteer_id } = req.body as {
        sos_request_id: string;
        preferred_volunteer_id?: string;
      };

      // Get SOS request location
      const { data: sos, error: sosError } = await supabase
        .from('sos_requests')
        .select('id, latitude, longitude, status')
        .eq('id', sos_request_id)
        .single();

      if (sosError || !sos) {
        res.status(404).json({ error: 'SOS request not found' });
        return;
      }

      if (sos.status === 'rescued' || sos.status === 'cancelled') {
        res.status(400).json({ error: 'Cannot assign volunteer to a completed/cancelled SOS request' });
        return;
      }

      let selectedVolunteerId: string;

      if (preferred_volunteer_id) {
        // Validate the preferred volunteer is available
        const { data: vol } = await supabase
          .from('volunteers')
          .select('id, is_available')
          .eq('id', preferred_volunteer_id)
          .single();

        if (!vol || !vol.is_available) {
          res.status(400).json({ error: 'Preferred volunteer is not available' });
          return;
        }
        selectedVolunteerId = preferred_volunteer_id;
      } else {
        // Auto-find nearest available volunteer using Haversine
        const { data: volunteers, error: volError } = await supabase
          .from('volunteers')
          .select('id, current_lat, current_lng')
          .eq('is_available', true);

        if (volError || !volunteers || volunteers.length === 0) {
          res.status(404).json({ error: 'No available volunteers found' });
          return;
        }

        let nearest: { id: string; distance_km: number } | null = null;

        for (const vol of volunteers) {
          if (vol.current_lat == null || vol.current_lng == null) continue;
          const d = haversineKm(Number(sos.latitude), Number(sos.longitude), Number(vol.current_lat), Number(vol.current_lng));
          if (!nearest || d < nearest.distance_km) {
            nearest = { id: vol.id, distance_km: d };
          }
        }

        if (!nearest) {
          res.status(404).json({ error: 'No volunteers with location data available' });
          return;
        }

        selectedVolunteerId = nearest.id;
      }

      // Check for duplicate assignment
      const { data: existing } = await supabase
        .from('volunteer_assignments')
        .select('id')
        .eq('sos_request_id', sos_request_id)
        .eq('volunteer_id', selectedVolunteerId)
        .in('status', ['assigned', 'accepted'])
        .maybeSingle();

      if (existing) {
        res.status(409).json({ error: 'Volunteer already assigned to this SOS request' });
        return;
      }

      // Calculate distance/ETA if we have locations
      const { data: targetVol } = await supabase
        .from('volunteers')
        .select('current_lat, current_lng')
        .eq('id', selectedVolunteerId)
        .single();

      let distance_km: number | null = null;
      let eta_minutes: number | null = null;
      if (targetVol && targetVol.current_lat && targetVol.current_lng) {
        distance_km = haversineKm(Number(sos.latitude), Number(sos.longitude), Number(targetVol.current_lat), Number(targetVol.current_lng));
        // Rough estimate: 2 mins per km
        eta_minutes = Math.max(3, Math.round(distance_km * 2));
      }

      // Create assignment
      const { data: assignment, error: assignError } = await supabase
        .from('volunteer_assignments')
        .insert({
          sos_request_id,
          volunteer_id: selectedVolunteerId,
          status: 'assigned',
          distance_km,
          eta_minutes,
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (assignError) {
        res.status(500).json({ error: assignError.message });
        return;
      }

      // Mark volunteer as unavailable
      await supabase
        .from('volunteers')
        .update({ is_available: false })
        .eq('id', selectedVolunteerId);

      // Update SOS status to assigned
      await supabase
        .from('sos_requests')
        .update({ status: 'assigned', assigned_volunteer_id: selectedVolunteerId, updated_at: new Date().toISOString() })
        .eq('id', sos_request_id);

      // Notify volunteer
      const { data: volProfile } = await supabase
        .from('volunteers')
        .select('user_id')
        .eq('id', selectedVolunteerId)
        .single();

      if (volProfile?.user_id) {
        await supabase.from('notifications').insert({
          user_id: volProfile.user_id,
          title: '🚨 New Rescue Mission Assigned',
          message: `You have been assigned to an emergency SOS. Please accept or decline immediately.`,
          type: 'sos_alert',
          is_read: false,
          data: {
            assignment_id: assignment.id,
            sos_id: sos_request_id,
            reference_id: assignment.id,
            reference_type: 'volunteer_assignment',
          },
          created_at: new Date().toISOString(),
        });
      }

      res.status(201).json({ success: true, assignment });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// ---------------------------------------------------------------------------
// PATCH /api/volunteers/assignments/:id — Accept/reject/complete assignment
// ---------------------------------------------------------------------------
router.patch(
  '/assignments/:id',
  requireAuth,
  validateBody({
    status: {
      type: 'string',
      required: true,
      enum: ['accepted', 'rejected', 'completed'],
    },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body as { status: string; notes?: string };

      // Fetch assignment
      const { data: assignment, error: fetchError } = await supabase
        .from('volunteer_assignments')
        .select('*, volunteer:volunteer_id(id, user_id, total_missions)')
        .eq('id', id)
        .single();

      if (fetchError || !assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      // Volunteers can only update their own assignments; admins can update any
      if (req.user?.role !== 'admin') {
        const vol = assignment.volunteer as { id: string; user_id: string } | null;
        if (!vol || vol.user_id !== req.user?.id) {
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
      }

      const updatePayload: Record<string, unknown> = {
        status,
        notes: notes || null,
      };

      if (status === 'accepted') updatePayload.accepted_at = new Date().toISOString();
      if (status === 'completed') updatePayload.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('volunteer_assignments')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      // If rejected or completed, update volunteer availability and SOS request status
      const volInfo = assignment.volunteer as { id: string; total_missions: number } | null;

      if (status === 'rejected') {
        // Re-avail volunteer
        await supabase
          .from('volunteers')
          .update({ is_available: true })
          .eq('id', assignment.volunteer_id);

        // Reset SOS request back to pending
        await supabase
          .from('sos_requests')
          .update({ status: 'pending', assigned_volunteer_id: null, updated_at: new Date().toISOString() })
          .eq('id', assignment.sos_request_id);
      } else if (status === 'completed') {
        // Increment missions count & re-avail volunteer
        const totalMissions = (volInfo?.total_missions || 0) + 1;
        await supabase
          .from('volunteers')
          .update({ is_available: true, total_missions: totalMissions })
          .eq('id', assignment.volunteer_id);

        // Update SOS request to rescued
        const { data: updatedSos } = await supabase
          .from('sos_requests')
          .update({ status: 'rescued', updated_at: new Date().toISOString() })
          .eq('id', assignment.sos_request_id)
          .select('beneficiary_id')
          .single();

        // Create log in rescue_history
        await supabase.from('rescue_history').insert({
          sos_request_id: assignment.sos_request_id,
          volunteer_id: assignment.volunteer_id,
          beneficiary_id: updatedSos?.beneficiary_id || null,
          notes: notes || 'Rescued successfully by volunteer.',
          rescued_at: new Date().toISOString(),
        });
      } else if (status === 'accepted') {
        // Update SOS request to in_progress
        await supabase
          .from('sos_requests')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', assignment.sos_request_id);
      }

      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

export default router;
