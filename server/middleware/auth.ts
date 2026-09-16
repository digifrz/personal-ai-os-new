import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function extractAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string | undefined;
  const customEmail = req.headers['x-user-email'] as string | undefined;

  if (customUserId) {
    req.userId = customUserId;
    req.userEmail = customEmail || '';
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    // Use token as identity if passed
    req.userId = token;
    req.userEmail = customEmail || '';
    return next();
  }

  // Fallback if not authenticated
  req.userId = undefined;
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({
      error: 'Authentication required. Please provide a valid session identifier.',
      code: 'UNAUTHENTICATED',
      timestamp: new Date().toISOString(),
    });
  }
  next();
}
