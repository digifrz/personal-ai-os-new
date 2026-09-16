export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(message: string, code: ErrorCode = 'INTERNAL', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static from(err: unknown, fallbackCode: ErrorCode = 'INTERNAL'): AppError {
    if (err instanceof AppError) return err;
    if (err instanceof Error) {
      return new AppError(err.message, fallbackCode, { originalStack: err.stack });
    }
    return new AppError(String(err || 'An unexpected error occurred'), fallbackCode);
  }
}

export function formatErrorMessage(err: unknown): string {
  if (err instanceof AppError) {
    return err.message;
  }
  if (err instanceof Error) {
    // Strip raw network error noise if possible
    if (err.message.includes('permission-denied')) {
      return 'Permission denied. Please verify your authentication status.';
    }
    if (err.message.includes('not-found')) {
      return 'The requested resource could not be found.';
    }
    return err.message;
  }
  return 'A system error occurred. Please try again.';
}
