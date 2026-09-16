import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';

export const userRouter = Router();

const reportLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60 * 1000 });

userRouter.post('/report', reportLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { targetId, targetType, reason, details } = req.body;
    if (!targetId || !reason) {
      return res.status(400).json({ error: 'Target ID and reason are required' });
    }

    // In production, persist report to admin collection or trigger moderation hook
    console.log(`[Content Report Received] User ${req.userId} reported ${targetType}:${targetId} for "${reason}": ${details}`);

    res.json({
      success: true,
      reportId: `rep_${Date.now()}`,
      message: 'Report received and queued for trust & safety review.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

userRouter.get('/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    userId: req.userId,
    authenticated: true,
    timestamp: new Date().toISOString(),
  });
});
