import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/camps — List all camps (with optional district filter)
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { district, status, page = '1', limit = '50' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('relief_camps')
      .select(
        'id, name, address, latitude, longitude, status, max_capacity, current_occupancy, district_id, contact_phone, beds_total, beds_available, has_electricity, has_water, has_medical, established_date, officer_id, created_at',
        { count: 'exact' }
      )
      .order('name', { ascending: true })
      .range(offset, offset + limitNum - 1);

    if (district) query = query.eq('district_id', district);
    if (status) query = query.eq('status', status);

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
// POST /api/camps — Create a new camp
// ---------------------------------------------------------------------------
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateBody({
    name: { type: 'string', required: true, minLength: 2, maxLength: 200 },
    latitude: { type: 'number', required: true, min: -90, max: 90 },
    longitude: { type: 'number', required: true, min: -180, max: 180 },
    max_capacity: { type: 'number', required: true, min: 1 },
    district_id: { type: 'string', required: true },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        address,
        latitude,
        longitude,
        max_capacity,
        district_id,
        contact_name,
        contact_phone,
        status = 'active',
        beds_total = 0,
        beds_available = 0,
        has_electricity = false,
        has_water = false,
        has_medical = false,
        established_date,
        officer_id,
      } = req.body as {
        name: string;
        address?: string;
        latitude: number;
        longitude: number;
        max_capacity: number;
        district_id: string;
        contact_name?: string;
        contact_phone?: string;
        status?: string;
        beds_total?: number;
        beds_available?: number;
        has_electricity?: boolean;
        has_water?: boolean;
        has_medical?: boolean;
        established_date?: string;
        officer_id?: string;
      };

      const { data, error } = await supabase
        .from('relief_camps')
        .insert({
          name,
          address: address || null,
          latitude,
          longitude,
          max_capacity,
          current_occupancy: 0,
          district_id,
          contact_name: contact_name || null,
          contact_phone: contact_phone || null,
          status,
          beds_total,
          beds_available,
          has_electricity,
          has_water,
          has_medical,
          established_date: established_date || null,
          officer_id: officer_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

// ---------------------------------------------------------------------------
// PATCH /api/camps/:id — Update camp details
// ---------------------------------------------------------------------------
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        address,
        latitude,
        longitude,
        max_capacity,
        current_occupancy,
        district_id,
        contact_name,
        contact_phone,
        status,
        beds_total,
        beds_available,
        has_electricity,
        has_water,
        has_medical,
        established_date,
        officer_id,
      } = req.body as {
        name?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        max_capacity?: number;
        current_occupancy?: number;
        district_id?: string;
        contact_name?: string;
        contact_phone?: string;
        status?: string;
        beds_total?: number;
        beds_available?: number;
        has_electricity?: boolean;
        has_water?: boolean;
        has_medical?: boolean;
        established_date?: string;
        officer_id?: string;
      };

      const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updatePayload.name = name;
      if (address !== undefined) updatePayload.address = address;
      if (latitude !== undefined) updatePayload.latitude = latitude;
      if (longitude !== undefined) updatePayload.longitude = longitude;
      if (max_capacity !== undefined) updatePayload.max_capacity = max_capacity;
      if (current_occupancy !== undefined) updatePayload.current_occupancy = current_occupancy;
      if (district_id !== undefined) updatePayload.district_id = district_id;
      if (contact_name !== undefined) updatePayload.contact_name = contact_name;
      if (contact_phone !== undefined) updatePayload.contact_phone = contact_phone;
      if (status !== undefined) updatePayload.status = status;
      if (beds_total !== undefined) updatePayload.beds_total = beds_total;
      if (beds_available !== undefined) updatePayload.beds_available = beds_available;
      if (has_electricity !== undefined) updatePayload.has_electricity = has_electricity;
      if (has_water !== undefined) updatePayload.has_water = has_water;
      if (has_medical !== undefined) updatePayload.has_medical = has_medical;
      if (established_date !== undefined) updatePayload.established_date = established_date;
      if (officer_id !== undefined) updatePayload.officer_id = officer_id;

      const { data, error } = await supabase
        .from('relief_camps')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        res.status(404).json({ error: 'Camp not found or update failed' });
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
// DELETE /api/camps/:id — Delete a camp
// ---------------------------------------------------------------------------
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { data: camp } = await supabase
        .from('relief_camps')
        .select('current_occupancy')
        .eq('id', id)
        .single();

      if (camp && camp.current_occupancy > 0) {
        res.status(400).json({
          error: `Cannot delete camp with ${camp.current_occupancy} occupant(s). Please relocate them first.`,
        });
        return;
      }

      const { error } = await supabase.from('relief_camps').delete().eq('id', id);

      if (error) {
        res.status(404).json({ error: 'Camp not found or deletion failed' });
        return;
      }

      res.json({ success: true, message: 'Camp deleted successfully' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/camps/:id/stats — Get camp statistics
// ---------------------------------------------------------------------------
router.get('/:id/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Camp base data
    const { data: camp, error: campError } = await supabase
      .from('relief_camps')
      .select('*')
      .eq('id', id)
      .single();

    if (campError || !camp) {
      res.status(404).json({ error: 'Camp not found' });
      return;
    }

    // Inventory summary from inventory table
    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, item_name, current_stock, min_threshold, unit')
      .eq('camp_id', id);

    // SOS requests linked to this camp via rescue history
    const { count: sosCount } = await supabase
      .from('rescue_history')
      .select('id', { count: 'exact', head: true })
      .eq('camp_id', id);

    // Available volunteers active in the same district as the camp
    const { count: volunteerCount } = await supabase
      .from('volunteers')
      .select('id', { count: 'exact', head: true })
      .eq('district_id', camp.district_id)
      .eq('is_available', true);

    const lowStock = (inventory || []).filter(
      (item: { current_stock: number; min_threshold: number }) =>
        item.current_stock <= item.min_threshold
    );

    const occupancyPct = camp.max_capacity > 0
      ? Math.round((camp.current_occupancy / camp.max_capacity) * 100)
      : 0;

    res.json({
      camp,
      stats: {
        occupancy_percent: occupancyPct,
        available_beds: Math.max(0, camp.max_capacity - camp.current_occupancy),
        total_sos_directed: sosCount ?? 0,
        active_volunteers: volunteerCount ?? 0,
        inventory_items: (inventory || []).length,
        low_stock_items: lowStock.length,
        low_stock_details: lowStock,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
