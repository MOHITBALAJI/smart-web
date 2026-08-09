import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/inventory/:camp_id — Get inventory for a specific camp
// ---------------------------------------------------------------------------
router.get('/:camp_id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { camp_id } = req.params;
    const { category, low_stock } = req.query as Record<string, string>;

    // Verify camp exists
    const { error: campError } = await supabase
      .from('relief_camps')
      .select('id')
      .eq('id', camp_id)
      .single();

    if (campError) {
      res.status(404).json({ error: 'Camp not found' });
      return;
    }

    let query = supabase
      .from('inventory')
      .select('*')
      .eq('camp_id', camp_id)
      .order('category', { ascending: true })
      .order('item_name', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    let items = data || [];

    // Filter low stock client-side if requested
    if (low_stock === 'true') {
      items = items.filter(
        (item: { current_stock: number; min_threshold: number }) =>
          item.current_stock <= item.min_threshold
      );
    }

    const summary = {
      total_items: items.length,
      low_stock_count: items.filter(
        (item: { current_stock: number; min_threshold: number }) =>
          item.current_stock <= item.min_threshold
      ).length,
      out_of_stock_count: items.filter(
        (item: { current_stock: number }) => item.current_stock === 0
      ).length,
    };

    res.json({ data: items, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/inventory/:camp_id/adjust — Add or subtract stock
// ---------------------------------------------------------------------------
router.post(
  '/:camp_id/adjust',
  requireAuth,
  requireRole('admin', 'volunteer'),
  validateBody({
    item_id: { type: 'string', required: true },
    adjustment: { type: 'number', required: true },
    reason: { type: 'string', required: true, minLength: 3, maxLength: 500 },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { camp_id } = req.params;
      const { item_id, adjustment, reason, unit } = req.body as {
        item_id: string;
        adjustment: number;
        reason: string;
        unit?: string;
      };

      if (adjustment === 0) {
        res.status(400).json({ error: 'Adjustment value cannot be zero' });
        return;
      }

      // Fetch current item
      const { data: item, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', item_id)
        .eq('camp_id', camp_id)
        .single();

      if (fetchError || !item) {
        res.status(404).json({ error: 'Inventory item not found in this camp' });
        return;
      }

      const newStock = item.current_stock + adjustment;

      if (newStock < 0) {
        res.status(400).json({
          error: `Insufficient stock. Current: ${item.current_stock}, Attempted deduction: ${Math.abs(adjustment)}`,
        });
        return;
      }

      // Update stock
      // total_received or total_distributed mapping
      const isPositive = adjustment > 0;
      const updatePayload: Record<string, any> = {
        current_stock: newStock,
        updated_at: new Date().toISOString(),
      };
      if (isPositive) {
        updatePayload.total_received = item.total_received + adjustment;
      } else {
        updatePayload.total_distributed = item.total_distributed + Math.abs(adjustment);
      }

      const { data: updated, error: updateError } = await supabase
        .from('inventory')
        .update(updatePayload)
        .eq('id', item_id)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: updateError.message });
        return;
      }

      // Log the adjustment in public.audit_logs
      await supabase.from('audit_logs').insert({
        user_id: req.user?.id,
        action: 'UPDATE',
        table_name: 'inventory',
        record_id: item_id,
        old_values: { current_stock: item.current_stock, total_received: item.total_received, total_distributed: item.total_distributed },
        new_values: { current_stock: newStock, adjustment, reason },
        created_at: new Date().toISOString(),
      });

      // NOTE: Database Trigger in triggers.sql (trg_inventory_notify_low_stock)
      // already automatically generates the low stock notifications, so we don't
      // need to duplicate that notification insertion logic here.

      res.json({
        success: true,
        data: updated,
        adjustment_summary: {
          previous_stock: item.current_stock,
          adjustment,
          new_stock: newStock,
          is_low_stock: newStock <= item.min_threshold,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/inventory/alerts — Get all low-stock items across all camps
// ---------------------------------------------------------------------------
export async function inventoryAlertsHandler(req: Request, res: Response): Promise<void> {
  try {
    const { district } = req.query as Record<string, string>;

    // Fetch all inventory items
    const { data: allItems, error } = await supabase
      .from('inventory')
      .select('*, camp:camp_id(id, name, district_id, address)')
      .order('current_stock', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    let alerts = (allItems || []).filter(
      (item: { current_stock: number; min_threshold: number }) =>
        item.current_stock <= item.min_threshold
    );

    if (district) {
      alerts = alerts.filter((item: { camp: { district_id: string } | null }) =>
        item.camp?.district_id === district
      );
    }

    const outOfStock = alerts.filter((item: { current_stock: number }) => item.current_stock === 0);
    const lowStock = alerts.filter((item: { current_stock: number }) => item.current_stock > 0);

    res.json({
      summary: {
        total_alerts: alerts.length,
        out_of_stock: outOfStock.length,
        low_stock: lowStock.length,
      },
      out_of_stock: outOfStock,
      low_stock: lowStock,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
}

export default router;
