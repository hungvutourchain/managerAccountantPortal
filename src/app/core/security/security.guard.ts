import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { SecurityService } from './security.service';
import { SecurityEventType } from './security.config';

/**
 * Enhanced Security Guard for hotelTourPortal
 * Tổng hợp tất cả các kiểm tra bảo mật
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private securityService: SecurityService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.performSecurityCheck(state.url, route);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.performSecurityCheck(state.url, route);
  }

  /**
   * Comprehensive security check
   */
  private performSecurityCheck(url: string, route?: ActivatedRouteSnapshot): Observable<boolean> {
    // Log access attempt
    this.securityService.logSecurityEvent(
      'route_access_attempt',
      { 
        url,
        route_data: route?.data,
        user_agent: navigator.userAgent
      },
      'low'
    );

    // Check 1: Authentication
    return this.authService.check().pipe(
      map(authenticated => {
        if (!authenticated) {
          this.securityService.logSecurityEvent(
            SecurityEventType.UNAUTHORIZED_ACCESS,
            { 
              attempted_url: url, 
              reason: 'not_authenticated',
              route_data: route?.data
            },
            'medium'
          );
          this.redirectToLogin(url);
          return false;
        }

        // Check 2: User blocked due to failed attempts
        if (this.securityService.isUserBlocked()) {
          this.securityService.logSecurityEvent(
            'access_denied_user_blocked',
            { 
              attempted_url: url,
              stats: this.securityService.getSecurityStats()
            },
            'high'
          );
          this.redirectToBlocked();
          return false;
        }

        // Check 3: Route-specific security checks
        if (route?.data?.['requiresHighSecurity']) {
          const securityStats = this.securityService.getSecurityStats();
          if (securityStats.threat_level === 'CRITICAL' || securityStats.threat_level === 'HIGH') {
            this.securityService.logSecurityEvent(
              'high_security_route_blocked',
              { 
                attempted_url: url,
                threat_level: securityStats.threat_level,
                stats: securityStats
              },
              'high'
            );
            this.redirectToSecurityWarning();
            return false;
          }
        }

        // Check 4: Detect suspicious activity
        this.securityService.detectSuspiciousActivity();

        // Check 5: Session validation for sensitive routes
        if (route?.data?.['requiresSessionValidation']) {
          // This would normally be an async check, but for simplicity we'll just log it
          this.securityService.logSecurityEvent(
            'session_validation_required',
            { url, route_data: route.data },
            'medium'
          );
        }

        // Log successful access
        this.securityService.logSecurityEvent(
          'route_access_granted',
          { url, route_data: route?.data },
          'low'
        );

        return true;
      }),
      catchError((error) => {
        this.securityService.logSecurityEvent(
          'security_guard_error',
          { 
            error: error?.message || 'Unknown error',
            attempted_url: url,
            stack: error?.stack
          },
          'high'
        );
        this.redirectToLogin(url);
        return of(false);
      })
    );
  }

  /**
   * Redirect to login with security context
   */
  private redirectToLogin(attemptedUrl?: string): void {
    const queryParams: any = { 
      reason: 'security_check_failed',
      timestamp: Date.now()
    };

    if (attemptedUrl) {
      queryParams.redirectURL = attemptedUrl;
    }

    this.router.navigate(['/landing'], { queryParams });
  }

  /**
   * Redirect to blocked page
   */
  private redirectToBlocked(): void {
    this.router.navigate(['/blocked'], {
      queryParams: {
        reason: 'too_many_failed_attempts',
        timestamp: Date.now(),
        stats: JSON.stringify(this.securityService.getSecurityStats())
      }
    });
  }

  /**
   * Redirect to security warning page
   */
  private redirectToSecurityWarning(): void {
    this.router.navigate(['/security-warning'], {
      queryParams: {
        reason: 'high_threat_level',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Check if route requires additional security measures
   */
  private isHighSecurityRoute(route: ActivatedRouteSnapshot): boolean {
    const highSecurityPatterns = [
      /.*\/admin\/.*/,
      /.*\/finance\/.*/,
      /.*\/reports\/.*/,
      /.*\/settings\/.*/,
      /.*\/user-management\/.*/
    ];

    const url = route.routeConfig?.path || '';
    return highSecurityPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Validate user permissions for route
   */
  private hasRoutePermissions(route: ActivatedRouteSnapshot): Observable<boolean> {
    // This would typically check user roles/permissions
    // For now, we'll just return true but log the check
    this.securityService.logSecurityEvent(
      'permission_check',
      { 
        route: route.routeConfig?.path,
        required_roles: route.data?.['roles'] || [],
        user_permissions: 'checking...' // Would get from UserService
      },
      'low'
    );

    return of(true);
  }
}