import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  district_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies the Supabase JWT token from the Authorization header,
 * fetches the user profile from the DB, and attaches user + role to req.user.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch user profile (role, name, district) from our users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, full_name, district_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Fallback: use auth user data with default role
      req.user = {
        id: user.id,
        email: user.email ?? '',
        role: (user.user_metadata?.role as string) || 'victim',
        full_name: user.user_metadata?.full_name as string | undefined,
      };
      next();
      return;
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
      district_id: profile.district_id,
    };

    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication error';
    res.status(500).json({ error: message });
  }
}

/**
 * Role-based access control middleware.
 * Usage: requireRole('admin'), requireRole('admin', 'volunteer')
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden: insufficient permissions',
        required: roles,
        current: req.user.role,
      });
      return;
    }
    next();
  };
}
