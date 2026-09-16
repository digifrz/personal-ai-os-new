import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Server Error Handler]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An internal server error occurred';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: message,
    code,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
}
