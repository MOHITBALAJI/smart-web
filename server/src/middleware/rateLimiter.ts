import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Cleans up expired entries every 5 minutes to prevent memory leaks.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const key = `${ip}:${req.path}:${maxRequests}:${windowMs}`;
    const now = Date.now();

    let record = store.get(key);

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      store.set(key, record);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
      next();
      return;
    }

    record.count += 1;

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfter,
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      });
      return;
    }

    next();
  };
}

/** SOS endpoints: 5 requests per minute per IP */
export const sosRateLimit = createRateLimiter(5, 60 * 1000);

/** General API endpoints: 100 requests per minute per IP */
export const apiRateLimit = createRateLimiter(100, 60 * 1000);
