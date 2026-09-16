import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const clientLimits = new Map<string, RateLimitEntry>();

export function createRateLimiter(options: { maxRequests: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();

    const record = clientLimits.get(ip) || { count: 0, resetTime: now + options.windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + options.windowMs;
    } else {
      record.count += 1;
    }

    clientLimits.set(ip, record);

    // Set headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > options.maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please throttle your invocations to ensure service stability.',
        code: 'RATE_LIMITED',
        retryAfterMs: record.resetTime - now,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}
