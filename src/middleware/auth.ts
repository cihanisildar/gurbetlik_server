import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import * as authService from '../services/AuthService';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Try to get token from cookie first, then fallback to Authorization header
  const cookieToken = req.cookies?.gb_accessToken;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }

  try {
    const decoded = authService.verifyAccessToken(token);
    
    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Try to get token from cookie first, then fallback to Authorization header
  const cookieToken = req.cookies?.gb_accessToken;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  
  const token = cookieToken || headerToken;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = authService.verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    });

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Silently continue without user
  }

  next();
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}; 