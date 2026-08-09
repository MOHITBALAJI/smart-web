import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load env vars first, before any other imports that may use them
dotenv.config();

import { supabase } from './config/supabase';
import { apiRateLimit } from './middleware/rateLimiter';

// Route imports
import sosRouter from './routes/sos';
import volunteersRouter from './routes/volunteers';
import mapsRouter from './routes/maps';
import inventoryRouter, { inventoryAlertsHandler } from './routes/inventory';
import reportsRouter from './routes/reports';
import notificationsRouter from './routes/notifications';
import campsRouter from './routes/camps';

// ---------------------------------------------------------------------------
// App initialization
// ---------------------------------------------------------------------------
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ---------------------------------------------------------------------------
// Security & parsing middleware
// ---------------------------------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim());
      // Allow requests with no origin (e.g. mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Global rate limiting on all API routes
// ---------------------------------------------------------------------------
app.use('/api', apiRateLimit);

// ---------------------------------------------------------------------------
// Health check (no auth required)
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req: Request, res: Response): Promise<void> => {
  let dbStatus: 'connected' | 'disconnected' | string = 'disconnected';

  try {
    const { error } = await supabase.from('camps').select('id').limit(1);
    dbStatus = error ? `error: ${error.message}` : 'connected';
  } catch (err: unknown) {
    dbStatus = `error: ${err instanceof Error ? err.message : 'unknown'}`;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: '1.0.0',
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// ---------------------------------------------------------------------------
// Mount route modules
// ---------------------------------------------------------------------------

// SOS requests
app.use('/api/sos', sosRouter);

// Volunteers
app.use('/api/volunteers', volunteersRouter);

// Maps proxy (Google Maps API, nearest camp/volunteer)
app.use('/api/maps', mapsRouter);

// Inventory — /alerts must come before /:camp_id to avoid route collision
app.get('/api/inventory/alerts', inventoryAlertsHandler);
app.use('/api/inventory', inventoryRouter);

// Reports
app.use('/api/reports', reportsRouter);

// Notifications
app.use('/api/notifications', notificationsRouter);

// Camps
app.use('/api/camps', campsRouter);

// ---------------------------------------------------------------------------
// 404 handler for undefined routes
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------------------------------------------------------------------------
// Global error handling middleware
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: NextFunction): void => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // CORS errors
  if (err.message.startsWith('CORS:')) {
    res.status(403).json({ error: err.message });
    return;
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed' || err.name === 'SyntaxError') {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { details: err.message, stack: err.stack } : {}),
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[Server] Express server running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[Server] CORS allowed origin(s): ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

export default app;
