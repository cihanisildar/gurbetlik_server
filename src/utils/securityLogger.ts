import { Request } from 'express';

interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'AUTH_SUCCESS' | 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY' | 'FILE_UPLOAD_BLOCKED' | 'XSS_ATTEMPT' | 'SQL_INJECTION_ATTEMPT';
  userId?: string;
  ip: string;
  userAgent?: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  endpoint?: string;
  method?: string;
}

class SecurityLogger {
  private static instance: SecurityLogger;

  private constructor() {}

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  private getClientInfo(req: Request) {
    return {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      endpoint: req.originalUrl || req.url,
      method: req.method
    };
  }

  private logEvent(event: SecurityEvent): void {
    // In production, this should integrate with your logging service
    // (e.g., Winston, Datadog, Sentry, etc.)
    const logEntry = {
      ...event,
      environment: process.env.NODE_ENV || 'development',
      service: 'gurbetci-server'
    };

    // Console logging for development
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
      console.error('🚨 SECURITY ALERT:', JSON.stringify(logEntry, null, 2));
    } else {
      console.warn('⚠️ Security Event:', JSON.stringify(logEntry, null, 2));
    }

    // TODO: In production, send to external logging service
    // - Send to SIEM system
    // - Store in security database
    // - Trigger alerts for critical events
  }

  public logAuthFailure(req: Request, details: string, userId?: string): void {
    this.logEvent({
      type: 'AUTH_FAILURE',
      ...(userId && { userId }),
      details,
      severity: 'MEDIUM',
      timestamp: new Date(),
      ...this.getClientInfo(req)
    });
  }

  public logAuthSuccess(req: Request, userId: string): void {
    this.logEvent({
      type: 'AUTH_SUCCESS',
      userId,
      details: 'User successfully authenticated',
      severity: 'LOW',
      timestamp: new Date(),
      ...this.getClientInfo(req)
    });
  }

  public logUnauthorizedAccess(req: Request, details: string): void {
    this.logEvent({
      type: 'UNAUTHORIZED_ACCESS',
      details,
      severity: 'HIGH',
      timestamp: new Date(),
      ...this.getClientInfo(req)
    });
  }

  public logRateLimitExceeded(req: Request, limitType: string): void {
    this.logEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      details: `Rate limit exceeded for ${limitType}`,
      severity: 'MEDIUM',
      timestamp: new Date(),
      ...this.getClientInfo(req)
    });
  }

  public logSuspiciousActivity(req: Request, details: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'): void {
    this.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      details,
      severity,
      timestamp: new Date(),
      ...this.getClientInfo(req)
    });
  }

  public logFileUploadBlocked(req: Request, reason: string, userId?: string): void {
    this.logEvent({
      type: 'FILE_UPLOAD_BLOCKED',
      ...(userId && { userId }),
      details: `File upload blocked: ${reason}`,
      severity: 'MEDIUM',
      timestamp: new Date(),
      ...this.getClientInfo(req)
    });
  }

  public logXSSAttempt(req: Request, payload: string, userId?: string): void {
    this.logEvent({
      type: 'XSS_ATTEMPT',
      ...(userId && { userId }),
      details: `Potential XSS attempt detected: ${payload.substring(0, 200)}`,
      severity: 'HIGH',
      timestamp: new Date(),
      ...this.getClientInfo(req)
    });
  }

  public logSQLInjectionAttempt(req: Request, payload: string, userId?: string): void {
    this.logEvent({
      type: 'SQL_INJECTION_ATTEMPT',
      ...(userId && { userId }),
      details: `Potential SQL injection attempt: ${payload.substring(0, 200)}`,
      severity: 'HIGH',
      timestamp: new Date(),
      ...this.getClientInfo(req)
    });
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();
export default securityLogger; 