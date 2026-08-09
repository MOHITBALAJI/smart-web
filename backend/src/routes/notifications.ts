import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/notifications — Get notifications for the current user
// ---------------------------------------------------------------------------
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { unread_only, page = '1', limit = '30' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Each user sees their own notifications OR role-broadcast notifications
    query = query.or(
      `user_id.eq.${req.user!.id},and(target_role.eq.${req.user!.role},user_id.is.null)`
    );

    if (unread_only === 'true') query = query.eq('is_read', false);

    const { data, error, count } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const unreadCount = (data || []).filter(
      (n: { is_read: boolean }) => !n.is_read
    ).length;

    res.json({
      data,
      unread_count: unreadCount,
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
// PATCH /api/notifications/:id/read — Mark a specific notification as read
// ---------------------------------------------------------------------------
router.patch('/:id/read', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only allow marking your own notifications
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .or(`user_id.eq.${req.user!.id},target_role.eq.${req.user!.role}`)
      .select()
      .single();

    if (error) {
      res.status(404).json({ error: 'Notification not found or not accessible' });
      return;
    }

    res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/notifications/read-all — Mark all notifications as read
// ---------------------------------------------------------------------------
router.patch('/read-all', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .or(`user_id.eq.${req.user!.id},and(target_role.eq.${req.user!.role},user_id.is.null)`)
      .eq('is_read', false);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/notifications/broadcast — Send broadcast notification to a role
// ---------------------------------------------------------------------------
router.post(
  '/broadcast',
  requireAuth,
  requireRole('admin'),
  validateBody({
    title: { type: 'string', required: true, minLength: 3, maxLength: 200 },
    message: { type: 'string', required: true, minLength: 5, maxLength: 1000 },
    target_role: {
      type: 'string',
      required: true,
      enum: ['admin', 'volunteer', 'victim', 'all'],
    },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, message, target_role, type = 'broadcast', reference_id, reference_type } = req.body as {
        title: string;
        message: string;
        target_role: string;
        type?: string;
        reference_id?: string;
        reference_type?: string;
      };

      if (target_role === 'all') {
        // Insert one notification for each role
        const roles = ['admin', 'volunteer', 'victim'];
        const inserts = roles.map((role) => ({
          title,
          message,
          type,
          target_role: role,
          user_id: null,
          reference_id: reference_id || null,
          reference_type: reference_type || null,
          is_read: false,
          created_by: req.user?.id,
          created_at: new Date().toISOString(),
        }));

        const { data, error } = await supabase
          .from('notifications')
          .insert(inserts)
          .select();

        if (error) {
          res.status(500).json({ error: error.message });
          return;
        }

        res.status(201).json({
          success: true,
          message: `Broadcast sent to all roles`,
          notifications: data,
        });
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          type,
          target_role,
          user_id: null, // role-level broadcast has no specific user
          reference_id: reference_id || null,
          reference_type: reference_type || null,
          is_read: false,
          created_by: req.user?.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(201).json({
        success: true,
        message: `Broadcast sent to role: ${target_role}`,
        notification: data,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

export default router;
