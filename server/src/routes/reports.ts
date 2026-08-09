import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

function getDistrictId(s: any): string | null {
  const beneficiary = Array.isArray(s.beneficiary) ? s.beneficiary[0] : s.beneficiary;
  if (!beneficiary) return null;
  const users = Array.isArray(beneficiary.users) ? beneficiary.users[0] : beneficiary.users;
  return users?.district_id || null;
}

// ---------------------------------------------------------------------------
// GET /api/reports/summary — Aggregate system-wide stats
// ---------------------------------------------------------------------------
router.get('/summary', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      { count: totalSos },
      { count: rescuedSos },
      { count: pendingSos },
      { count: inProgressSos },
      { count: totalCamps },
      { count: activeCamps },
      { count: totalVolunteers },
      { count: availableVolunteers },
      { data: campOccupancy },
    ] = await Promise.all([
      supabase.from('sos_requests').select('id', { count: 'exact', head: true }),
      supabase.from('sos_requests').select('id', { count: 'exact', head: true }).eq('status', 'rescued'),
      supabase.from('sos_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('sos_requests').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('relief_camps').select('id', { count: 'exact', head: true }),
      supabase.from('relief_camps').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('volunteers').select('id', { count: 'exact', head: true }),
      supabase.from('volunteers').select('id', { count: 'exact', head: true }).eq('is_available', true),
      supabase.from('relief_camps').select('max_capacity, current_occupancy').eq('status', 'active'),
    ]);

    const totalCapacity = (campOccupancy || []).reduce(
      (sum: number, c: { max_capacity: number }) => sum + (c.max_capacity || 0), 0
    );
    const totalOccupancy = (campOccupancy || []).reduce(
      (sum: number, c: { current_occupancy: number }) => sum + (c.current_occupancy || 0), 0
    );

    res.json({
      sos: {
        total: totalSos ?? 0,
        rescued: rescuedSos ?? 0,
        pending: pendingSos ?? 0,
        in_progress: inProgressSos ?? 0,
        rescue_rate: totalSos
          ? Math.round(((rescuedSos ?? 0) / totalSos) * 100)
          : 0,
      },
      camps: {
        total: totalCamps ?? 0,
        active: activeCamps ?? 0,
        total_capacity: totalCapacity,
        total_occupancy: totalOccupancy,
        occupancy_percent: totalCapacity > 0
          ? Math.round((totalOccupancy / totalCapacity) * 100)
          : 0,
      },
      volunteers: {
        total: totalVolunteers ?? 0,
        available: availableVolunteers ?? 0,
        on_duty: (totalVolunteers ?? 0) - (availableVolunteers ?? 0),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/district/:district_id — District-level stats
// ---------------------------------------------------------------------------
router.get('/district/:district_id', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { district_id } = req.params;

    // Fetch all SOS requests to filter by beneficiary user district in memory
    const { data: allSos } = await supabase
      .from('sos_requests')
      .select('id, status, beneficiary:beneficiary_id(users:user_id(district_id))');

    const filteredSos = (allSos || []).filter(
      (s: any) => getDistrictId(s) === district_id
    );

    const totalSos = filteredSos.length;
    const rescuedSos = filteredSos.filter(s => s.status === 'rescued').length;
    const pendingSos = filteredSos.filter(s => s.status === 'pending').length;

    const [
      { count: totalCamps },
      { data: camps },
      { count: totalVolunteers },
    ] = await Promise.all([
      supabase.from('relief_camps').select('id', { count: 'exact', head: true }).eq('district_id', district_id),
      supabase.from('relief_camps').select('id, name, max_capacity, current_occupancy, status').eq('district_id', district_id),
      supabase.from('volunteers').select('id', { count: 'exact', head: true }).eq('district_id', district_id),
    ]);

    const totalCapacity = (camps || []).reduce(
      (sum: number, c: { max_capacity: number }) => sum + (c.max_capacity || 0), 0
    );
    const totalOccupancy = (camps || []).reduce(
      (sum: number, c: { current_occupancy: number }) => sum + (c.current_occupancy || 0), 0
    );

    res.json({
      district_id,
      sos: {
        total: totalSos,
        rescued: rescuedSos,
        pending: pendingSos,
        rescue_rate: totalSos ? Math.round((rescuedSos / totalSos) * 100) : 0,
      },
      camps: {
        total: totalCamps ?? 0,
        list: camps || [],
        total_capacity: totalCapacity,
        total_occupancy: totalOccupancy,
        occupancy_percent: totalCapacity > 0
          ? Math.round((totalOccupancy / totalCapacity) * 100)
          : 0,
      },
      volunteers: { total: totalVolunteers ?? 0 },
      generated_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/generate — Generate structured report data for export
// Query params: type, date_from, date_to, district_id
// ---------------------------------------------------------------------------
router.get('/generate', requireAuth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, date_from, date_to, district_id } = req.query as Record<string, string>;

    const validTypes = ['victim', 'volunteer', 'camp', 'inventory', 'rescue', 'district'];
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({
        error: 'Invalid or missing report type',
        valid_types: validTypes,
      });
      return;
    }

    let reportData: unknown[] = [];
    let reportMeta: Record<string, unknown> = {};

    switch (type) {
      // --- Victim / SOS Report ---
      case 'victim':
      case 'rescue': {
        let query = supabase
          .from('sos_requests')
          .select(`
            id, created_at, status, emergency_type, emergency_level, latitude, longitude,
            address, reporter_name, reporter_phone, description,
            beneficiary:beneficiary_id(users:user_id(district_id))
          `)
          .order('created_at', { ascending: false });

        if (date_from) query = query.gte('created_at', date_from);
        if (date_to) query = query.lte('created_at', date_to);
        if (type === 'rescue') query = query.eq('status', 'rescued');

        const { data, error } = await query;
        if (error) { res.status(500).json({ error: error.message }); return; }

        let list = data || [];

        // Filter by user district in memory if requested
        if (district_id) {
          list = list.filter(
            (s: any) => getDistrictId(s) === district_id
          );
        }

        reportData = list.map((s: any) => ({
          id: s.id,
          created_at: s.created_at,
          status: s.status,
          emergency_type: s.emergency_type,
          emergency_level: s.emergency_level,
          latitude: s.latitude,
          longitude: s.longitude,
          address: s.address,
          reporter_name: s.reporter_name,
          reporter_phone: s.reporter_phone,
          description: s.description,
          district_id: getDistrictId(s),
        }));

        reportMeta = {
          report_type: type,
          total_records: reportData.length,
          filters: { date_from, date_to, district_id },
          columns: [
            'id', 'created_at', 'status', 'emergency_type', 'emergency_level',
            'latitude', 'longitude', 'address', 'reporter_name', 'reporter_phone',
            'district_id', 'description',
          ],
        };
        break;
      }

      // --- Volunteer Report ---
      case 'volunteer': {
        let query = supabase
          .from('volunteers')
          .select(`
            id, created_at, is_available, current_lat, current_lng, district_id,
            users:user_id(full_name, email, phone),
            assignments:volunteer_assignments(id, status, assigned_at, completed_at)
          `)
          .order('created_at', { ascending: false });

        if (district_id) query = query.eq('district_id', district_id);

        const { data, error } = await query;
        if (error) { res.status(500).json({ error: error.message }); return; }

        reportData = (data || []).map((v: any) => ({
          id: v.id,
          created_at: v.created_at,
          full_name: v.users?.full_name || 'Unknown',
          email: v.users?.email || '',
          phone: v.users?.phone || '',
          is_available: v.is_available,
          district_id: v.district_id,
          total_assignments: v.assignments?.length || 0,
          completed_assignments: v.assignments?.filter((a: any) => a.status === 'completed').length || 0,
        }));

        reportMeta = {
          report_type: 'volunteer',
          total_records: reportData.length,
          filters: { district_id },
          columns: ['id', 'full_name', 'email', 'phone', 'is_available', 'district_id', 'total_assignments', 'completed_assignments'],
        };
        break;
      }

      // --- Camp Report ---
      case 'camp': {
        let query = supabase
          .from('relief_camps')
          .select('*')
          .order('name', { ascending: true });

        if (district_id) query = query.eq('district_id', district_id);

        const { data, error } = await query;
        if (error) { res.status(500).json({ error: error.message }); return; }

        reportData = (data || []).map((c: any) => ({
          ...c,
          available_beds: Math.max(0, c.max_capacity - c.current_occupancy),
          occupancy_percent: c.max_capacity > 0
            ? Math.round((c.current_occupancy / c.max_capacity) * 100)
            : 0,
        }));

        reportMeta = {
          report_type: 'camp',
          total_records: reportData.length,
          filters: { district_id },
          columns: ['id', 'name', 'address', 'status', 'max_capacity', 'current_occupancy', 'available_beds', 'occupancy_percent', 'district_id', 'contact_phone', 'created_at'],
        };
        break;
      }

      // --- Inventory Report ---
      case 'inventory': {
        const { data, error } = await supabase
          .from('inventory')
          .select('*, camp:camp_id(id, name, district_id)')
          .order('item_name', { ascending: true });

        if (error) { res.status(500).json({ error: error.message }); return; }

        let items = data || [];
        if (district_id) {
          items = items.filter((i: any) => i.camp?.district_id === district_id);
        }

        reportData = items.map((i: any) => ({
          id: i.id,
          item_name: i.item_name,
          category: i.category,
          current_stock: i.current_stock,
          min_threshold: i.min_threshold,
          unit: i.unit,
          camp_name: i.camp?.name,
          camp_id: i.camp?.id,
          district_id: i.camp?.district_id,
          status: i.current_stock === 0
            ? 'out_of_stock'
            : i.current_stock <= i.min_threshold
            ? 'low_stock'
            : 'ok',
        }));

        reportMeta = {
          report_type: 'inventory',
          total_records: reportData.length,
          filters: { district_id },
          columns: ['id', 'item_name', 'category', 'current_stock', 'min_threshold', 'unit', 'camp_name', 'district_id', 'status'],
        };
        break;
      }

      // --- District Summary Report ---
      case 'district': {
        const { data: districts, error } = await supabase
          .from('districts')
          .select('id, name');

        if (error) { res.status(500).json({ error: error.message }); return; }

        // Fetch all SOS to group by user district in memory
        const { data: allSos } = await supabase
          .from('sos_requests')
          .select('id, status, beneficiary:beneficiary_id(users:user_id(district_id))');

        const districtStats = await Promise.all(
          (districts || []).map(async (d: { id: string; name: string }) => {
            const sosInDistrict = (allSos || []).filter(s => getDistrictId(s) === d.id);
            const sosTot = sosInDistrict.length;
            const sosRes = sosInDistrict.filter(s => s.status === 'rescued').length;

            const [{ count: camps }, { count: vols }] = await Promise.all([
              supabase.from('relief_camps').select('id', { count: 'exact', head: true }).eq('district_id', d.id),
              supabase.from('volunteers').select('id', { count: 'exact', head: true }).eq('district_id', d.id),
            ]);

            return {
              district_id: d.id,
              district_name: d.name,
              total_sos: sosTot,
              rescued: sosRes,
              total_camps: camps ?? 0,
              total_volunteers: vols ?? 0,
              rescue_rate: sosTot ? Math.round((sosRes / sosTot) * 100) : 0,
            };
          })
        );

        reportData = districtStats;
        reportMeta = {
          report_type: 'district',
          total_records: reportData.length,
          columns: ['district_id', 'district_name', 'total_sos', 'rescued', 'total_camps', 'total_volunteers', 'rescue_rate'],
        };
        break;
      }
    }

    res.json({
      meta: {
        ...reportMeta,
        generated_at: new Date().toISOString(),
        generated_by: req.user?.id,
      },
      data: reportData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
