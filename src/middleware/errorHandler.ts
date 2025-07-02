import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  // Generate unique error ID for logging correlation
  const errorId = crypto.randomUUID();
  
  // Log full error details server-side (but don't send to client)
  console.error(`Error ID: ${errorId}`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
  
  // Define safe error responses that don't leak sensitive information
  const safeErrors: { [key: string]: { message: string, statusCode: number } } = {
    'ValidationError': { message: 'Invalid input provided', statusCode: 400 },
    'UnauthorizedError': { message: 'Authentication required', statusCode: 401 },
    'ForbiddenError': { message: 'Access denied', statusCode: 403 },
    'NotFoundError': { message: 'Resource not found', statusCode: 404 },
    'ConflictError': { message: 'Resource conflict', statusCode: 409 },
    'TooManyRequestsError': { message: 'Too many requests', statusCode: 429 }
  };

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Get safe error message or use generic one
  const safeError = safeErrors[err.name];
  const message = safeError ? safeError.message : 'An error occurred while processing your request';

  // Prepare response
  const response: any = {
    success: false,
    message,
    errorId // Include error ID for support correlation
  };

  // Only include additional details in development
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      originalMessage: err.message,
      stack: err.stack
    };
  }

  res.status(statusCode).json(response);
};

export default errorHandler; 