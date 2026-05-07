import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { environment as env } from 'environments/environment';
import { 
  DEFAULT_SECURITY_CONFIG, 
  SecurityConfig, 
  SecurityEventType, 
  SecurityLog, 
  SecurityUtils 
} from './security.config';

/**
 * Security Service for hotelTourPortal
 * Tập trung quản lý tất cả các tính năng bảo mật
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  
  private securityConfig: SecurityConfig = DEFAULT_SECURITY_CONFIG;
  private securityEvents$ = new BehaviorSubject<SecurityLog[]>([]);
  private failedLoginAttempts = 0;
  private suspiciousActivityCount = 0;
  private lastActivityCheck = new Date();

  constructor(private _httpClient: HttpClient) {
    // Initialize security monitoring
    this.initializeSecurityMonitoring();
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring(): void {
    // Log service initialization
    this.logSecurityEvent(
      'security_service_initialized',
      { version: '2.0.0', timestamp: new Date().toISOString() },
      'low'
    );

    // Start periodic security health checks
    setInterval(() => {
      this.performSecurityHealthCheck();
    }, 60000); // Every minute
  }

  /**
   * Configure security settings
   */
  configure(config: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...config };
    this.logSecurityEvent(
      'security_config_updated',
      { newConfig: config },
      'low'
    );
  }

  /**
   * Log security event và gửi về server nếu cần
   */
  logSecurityEvent(
    event: SecurityEventType | string, 
    data?: any, 
    severity: SecurityLog['severity'] = 'medium'
  ): void {
    const securityLog = SecurityUtils.createSecurityLog(event, data, severity);
    
    // Add to local event stream
    const currentEvents = this.securityEvents$.value;
    this.securityEvents$.next([...currentEvents.slice(-99), securityLog]); // Keep last 100 events
    
    // Log locally
    SecurityUtils.logSecurityEvent(securityLog, this.securityConfig);
    
    // Send to server nếu audit logging enabled và event severity cao
    if (this.securityConfig.ENABLE_AUDIT_LOGGING && 
        (severity === 'high' || severity === 'critical')) {
      this.sendSecurityEventToServer(securityLog).subscribe({
        error: (error) => console.warn('Failed to send security event to server:', error)
      });
    }
  }

  /**
   * Get security events stream
   */
  getSecurityEvents(): Observable<SecurityLog[]> {
    return this.securityEvents$.asObservable();
  }

  /**
   * Track login attempts with enhanced logic
   */
  recordLoginAttempt(success: boolean, userInfo?: any): void {
    if (success) {
      this.failedLoginAttempts = 0;
      this.logSecurityEvent(
        SecurityEventType.USER_LOGIN, 
        { 
          success: true,
          userAgent: navigator.userAgent,
          fingerprint: SecurityUtils.getClientFingerprint(),
          ...userInfo
        }, 
        'low'
      );
    } else {
      this.failedLoginAttempts++;
      this.logSecurityEvent(
        SecurityEventType.UNAUTHORIZED_ACCESS, 
        { 
          failed_attempts: this.failedLoginAttempts,
          max_attempts: this.securityConfig.MAX_LOGIN_ATTEMPTS,
          fingerprint: SecurityUtils.getClientFingerprint(),
          userAgent: navigator.userAgent
        }, 
        this.failedLoginAttempts >= this.securityConfig.MAX_LOGIN_ATTEMPTS ? 'critical' : 'medium'
      );

      // Block additional attempts nếu vượt quá threshold
      if (this.failedLoginAttempts >= this.securityConfig.MAX_LOGIN_ATTEMPTS) {
        this.blockUser();
      }
    }
  }

  /**
   * Check if user is blocked due to too many failed attempts
   */
  isUserBlocked(): boolean {
    return this.failedLoginAttempts >= this.securityConfig.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Reset failed login attempts
   */
  resetLoginAttempts(): void {
    const previousAttempts = this.failedLoginAttempts;
    this.failedLoginAttempts = 0;
    
    if (previousAttempts > 0) {
      this.logSecurityEvent(
        'login_attempts_reset',
        { previous_attempts: previousAttempts },
        'low'
      );
    }
  }

  /**
   * Block user temporarily
   */
  private blockUser(): void {
    const blockDuration = 15; // minutes
    
    this.logSecurityEvent(
      SecurityEventType.USER_BLOCKED,
      { 
        failed_attempts: this.failedLoginAttempts,
        block_duration_minutes: blockDuration,
        fingerprint: SecurityUtils.getClientFingerprint()
      },
      'critical'
    );

    // Reset sau block duration
    timer(blockDuration * 60 * 1000).subscribe(() => {
      this.resetLoginAttempts();
      this.logSecurityEvent('user_unblocked', { duration_minutes: blockDuration }, 'medium');
    });
  }

  /**
   * Validate session security
   */
  validateSession(): Observable<boolean> {
    return this._httpClient.get<boolean>(`${env.urlOperationApi}/Security/ValidateSession`);
  }

  /**
   * Send security event to server
   */
  private sendSecurityEventToServer(securityLog: SecurityLog): Observable<any> {
    return this._httpClient.post(`${env.urlOperationApi}/Security/LogEvent`, securityLog);
  }

  /**
   * Send logout notification to server
   */
  notifyLogout(reason: string): Observable<any> {
    return this._httpClient.post(`${env.urlOperationApi}/Security/NotifyLogout`, {
      reason,
      timestamp: new Date().toISOString(),
      fingerprint: SecurityUtils.getClientFingerprint()
    });
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  /**
   * Emergency security lockdown
   */
  emergencyLockdown(reason: string): void {
    this.logSecurityEvent(
      SecurityEventType.EMERGENCY_LOCKDOWN,
      { reason, fingerprint: SecurityUtils.getClientFingerprint() },
      'critical'
    );

    // Clear all storage
    SecurityUtils.clearAllStorage();
    
    // Redirect to secure page
    window.location.href = '/security-lockdown';
  }

  /**
   * Check for suspicious activity patterns
   */
  detectSuspiciousActivity(): void {
    const recentEvents = this.securityEvents$.value
      .filter(event => {
        const eventTime = new Date(event.timestamp);
        const now = new Date();
        const diffMinutes = (now.getTime() - eventTime.getTime()) / (1000 * 60);
        return diffMinutes <= 10; // Last 10 minutes
      });

    // Check for suspicious patterns
    const unauthorizedAttempts = recentEvents.filter(e => 
      e.event === SecurityEventType.UNAUTHORIZED_ACCESS
    ).length;

    const tokenIssues = recentEvents.filter(e => 
      e.event === SecurityEventType.TOKEN_EXPIRED || 
      e.event === SecurityEventType.TOKEN_INVALID
    ).length;

    const rapidRequests = recentEvents.filter(e =>
      e.event === 'http_security_error'
    ).length;

    // Evaluate threat level
    if (unauthorizedAttempts >= 5 || tokenIssues >= 3 || rapidRequests >= 10) {
      this.suspiciousActivityCount++;
      
      this.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        { 
          unauthorized_attempts: unauthorizedAttempts,
          token_issues: tokenIssues,
          rapid_requests: rapidRequests,
          time_window: '10 minutes',
          threat_level: this.calculateThreatLevel(unauthorizedAttempts, tokenIssues, rapidRequests)
        },
        'critical'
      );

      // Consider emergency lockdown for severe cases
      if (unauthorizedAttempts >= 10 || this.suspiciousActivityCount >= 3) {
        this.emergencyLockdown('Critical suspicious activity detected');
      }
    }
  }

  /**
   * Calculate threat level based on various factors
   */
  private calculateThreatLevel(unauthorized: number, tokenIssues: number, rapidRequests: number): string {
    const score = unauthorized * 3 + tokenIssues * 2 + rapidRequests * 1;
    
    if (score >= 30) return 'CRITICAL';
    if (score >= 20) return 'HIGH';
    if (score >= 10) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Perform periodic security health check
   */
  private performSecurityHealthCheck(): void {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.lastActivityCheck.getTime();
    
    // Check for unusual inactivity (might indicate session hijacking)
    if (timeSinceLastCheck > 30 * 60 * 1000) { // 30 minutes
      this.logSecurityEvent(
        'unusual_inactivity_detected',
        { minutes_inactive: Math.floor(timeSinceLastCheck / 60000) },
        'medium'
      );
    }

    // Check localStorage for potential tampering
    try {
      const authToken = localStorage.getItem('AuthToken');
      if (authToken && authToken.length < 10) {
        this.logSecurityEvent(
          'potential_token_tampering',
          { token_length: authToken.length },
          'high'
        );
      }
    } catch (error) {
      this.logSecurityEvent(
        'storage_access_error',
        { error: error?.toString() },
        'medium'
      );
    }

    this.lastActivityCheck = now;
  }

  /**
   * Report security incident manually
   */
  reportIncident(type: string, description: string, evidence?: any): void {
    this.logSecurityEvent(
      'manual_incident_report',
      {
        incident_type: type,
        description,
        evidence,
        reported_by: 'user',
        fingerprint: SecurityUtils.getClientFingerprint()
      },
      'high'
    );
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): any {
    const events = this.securityEvents$.value;
    const now = new Date();
    const last24Hours = events.filter(e => {
      const eventTime = new Date(e.timestamp);
      return (now.getTime() - eventTime.getTime()) <= 24 * 60 * 60 * 1000;
    });

    return {
      total_events: events.length,
      events_last_24h: last24Hours.length,
      failed_login_attempts: this.failedLoginAttempts,
      suspicious_activity_count: this.suspiciousActivityCount,
      is_user_blocked: this.isUserBlocked(),
      threat_level: this.calculateCurrentThreatLevel(last24Hours),
      last_activity_check: this.lastActivityCheck
    };
  }

  /**
   * Calculate current overall threat level
   */
  private calculateCurrentThreatLevel(recentEvents: SecurityLog[]): string {
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highEvents = recentEvents.filter(e => e.severity === 'high').length;
    
    if (criticalEvents >= 3) return 'CRITICAL';
    if (criticalEvents >= 1 || highEvents >= 5) return 'HIGH';
    if (highEvents >= 2) return 'MEDIUM';
    return 'LOW';
  }
}