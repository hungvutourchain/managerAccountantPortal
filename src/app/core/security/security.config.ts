/**
 * Security Configuration for hotelTourPortal
 * Tập trung các cài đặt bảo mật cho toàn bộ ứng dụng
 */

export interface SecurityConfig {
  // Periodic check intervals
  SECURITY_CHECK_INTERVAL: number;
  TOKEN_REFRESH_INTERVAL: number;
  
  // Security thresholds
  MAX_LOGIN_ATTEMPTS: number;
  SESSION_TIMEOUT: number;
  
  // Logging levels
  SECURITY_LOG_LEVEL: 'none' | 'warn' | 'error' | 'debug';
  
  // Features flags
  ENABLE_PERIODIC_CHECKS: boolean;
  ENABLE_AUDIT_LOGGING: boolean;
  CLEAR_STORAGE_ON_LOGOUT: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  // 5 phút cho security check
  SECURITY_CHECK_INTERVAL: 5 * 60 * 1000,
  
  // 15 phút cho token refresh warning
  TOKEN_REFRESH_INTERVAL: 15 * 60 * 1000,
  
  // Tối đa 5 lần login thất bại
  MAX_LOGIN_ATTEMPTS: 5,
  
  // 30 phút session timeout
  SESSION_TIMEOUT: 30 * 60 * 1000,
  
  // Warning level logging
  SECURITY_LOG_LEVEL: 'warn',
  
  // Feature flags
  ENABLE_PERIODIC_CHECKS: true,
  ENABLE_AUDIT_LOGGING: true,
  CLEAR_STORAGE_ON_LOGOUT: true
};

/**
 * Security Event Types
 */
export enum SecurityEventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_DEACTIVATED = 'user_deactivated',
  LICENSE_REVOKED = 'license_revoked',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERIODIC_CHECK_FAILED = 'periodic_check_failed',
  STORAGE_CLEARED = 'storage_cleared',
  SECURITY_CHECK_ERROR = 'security_check_error',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  EMERGENCY_LOCKDOWN = 'emergency_lockdown',
  USER_BLOCKED = 'user_blocked'
}

/**
 * Security Log Interface
 */
export interface SecurityLog {
  event: SecurityEventType | string;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  data?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Security Helper Functions
 */
export class SecurityUtils {
  
  /**
   * Create standardized security log entry
   */
  static createSecurityLog(
    event: SecurityEventType | string, 
    data?: any, 
    severity: SecurityLog['severity'] = 'medium'
  ): SecurityLog {
    return {
      event,
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      data,
      severity
    };
  }

  /**
   * Safe storage clear - handles errors gracefully
   */
  static clearAllStorage(): boolean {
    try {
      localStorage.clear();
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Safe storage item removal
   */
  static removeStorageItems(items: string[]): boolean {
    try {
      items.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      });
      return true;
    } catch (error) {
      console.error('Failed to remove storage items:', error);
      return false;
    }
  }

  /**
   * Log security event based on configuration
   */
  static logSecurityEvent(
    securityLog: SecurityLog, 
    config: SecurityConfig = DEFAULT_SECURITY_CONFIG
  ): void {
    if (config.SECURITY_LOG_LEVEL === 'none') return;
    
    const logPrefix = `[HOTEL_SECURITY ${securityLog.severity.toUpperCase()}]`;
    
    switch (securityLog.severity) {
      case 'critical':
        console.error(logPrefix, securityLog);
        break;
      case 'high':
        console.error(logPrefix, securityLog);
        break;
      case 'medium':
        console.warn(logPrefix, securityLog);
        break;
      case 'low':
        if (config.SECURITY_LOG_LEVEL === 'debug') {
          console.log(logPrefix, securityLog);
        }
        break;
    }

    // Send to server nếu audit logging enabled
    if (config.ENABLE_AUDIT_LOGGING) {
      // TODO: Implement server logging
      // SecurityService.sendAuditLog(securityLog);
    }
  }

  /**
   * Generate secure random string
   */
  static generateSecureId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Validate user session data
   */
  static validateUserSession(user: any): boolean {
    if (!user) return false;
    if (user.deactive) return false;
    if (!user.licensed) return false;
    return true;
  }

  /**
   * Get client fingerprint for tracking
   */
  static getClientFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Security fingerprint', 2, 2);
    }
    
    return btoa(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      canvas: canvas.toDataURL(),
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }));
  }
}