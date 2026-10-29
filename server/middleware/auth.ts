import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '../migrations';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

/**
 * Validates and extracts authentication identity from incoming requests.
 * Uses Firebase Admin SDK to cryptographically verify the ID token.
 * Rejects arbitrary or unverified identity headers to prevent impersonation.
 */
export async function extractAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const app = getAdminApp();
        if (app) {
          const decodedToken = await getAuth(app).verifyIdToken(token);
          req.userId = decodedToken.uid;
          req.userEmail = decodedToken.email || '';
          return next();
        }
      } catch (err: any) {
        // Log token validation failure for security audit
        console.warn('[Auth Security] Rejected unverified or expired token:', err?.message || err);
        req.userId = undefined;
        req.userEmail = undefined;
        return next();
      }
    }
  }

  req.userId = undefined;
  req.userEmail = undefined;
  next();
}

/**
 * Enforces authentication on protected endpoints.
 * Returns 401 Unauthorized if no cryptographically verified identity is present.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({
      error: 'Authentication required. A valid Firebase ID token must be provided in Authorization header.',
      code: 'UNAUTHENTICATED',
      timestamp: new Date().toISOString(),
    });
  }
  next();
}
