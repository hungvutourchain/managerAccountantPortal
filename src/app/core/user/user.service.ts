import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, pipe, EMPTY } from 'rxjs';
import { map, takeUntil, tap, catchError } from 'rxjs/operators';
import { User } from 'app/core/user/user.types';
import { environment as env } from 'environments/environment';
import { DbService } from 'app/shared/connectData/db.service';
import { 
  DEFAULT_SECURITY_CONFIG, 
  SecurityConfig, 
  SecurityEventType, 
  SecurityUtils 
} from 'app/core/security/security.config';
@Injectable({
  providedIn: 'root',
})
export class UserService implements OnDestroy {
  private _user: ReplaySubject<any> = new ReplaySubject<any>(1);
  private _securityCheckTimer: any;
  private readonly securityConfig: SecurityConfig = DEFAULT_SECURITY_CONFIG;
  // private _localConfig: ReplaySubject<any> = new ReplaySubject<any>(1);

  /**
   * Constructor
   */
  constructor(private _httpClient: HttpClient, private dbService: DbService) {
    // Bắt đầu security check timer
    this.startSecurityCheckTimer();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter & getter for user
   *
   * @param value
   */
  set user(value: any) {
    // Store the value
    this._user.next(value);
  }

  get user$(): Observable<any> {
    return this._user.asObservable();
  }

  // set config(value: any) {
  //   this._localConfig.next(value);
  // }

  // get config$(): Observable<any> {
  //   return this._localConfig.asObservable();
  // }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get the current logged in user data
   */
  get(): Observable<any> {
    return this._httpClient.get(`${env.urlOperationApi}/ManagerUser/BackendInfo`).pipe(
      tap(async (user: any) => {
        // Tăng cường an ninh: logout nếu user deactive hoặc không có licensed
        if (!user || user.deactive || !user.licensed) {
          const eventType = !user ? SecurityEventType.UNAUTHORIZED_ACCESS : 
                           user.deactive ? SecurityEventType.USER_DEACTIVATED : 
                           SecurityEventType.LICENSE_REVOKED;
          
          const reason = !user ? 'no_user_data' : 
                        user.deactive ? 'user_deactivated' : 'license_revoked';
          
          // Log critical security event
          const securityLog = SecurityUtils.createSecurityLog(
            eventType,
            { reason, userStatus: { deactive: user?.deactive, licensed: user?.licensed } },
            'critical'
          );
          SecurityUtils.logSecurityEvent(securityLog, this.securityConfig);
          
          this.logout(reason);
          return;
        }
        user.isviewAdmin = true;
        user.IsReservation = false;
        user.IsReservationLeader = false;
        user.IsLeader = false;
        user.IsProduct = false;
        user.IsView = false;
        user.IsUser = false;
        user.IsOperation = false;
        user.IsAdmin = false;
        user.IsReport = false;
        this.Checkrole(user.role, user);
        this._user.next(user);
      })
    );
  }
  // Hàm logout user khỏi hệ thống
  public logout(reason: string = 'security_violation'): void {
    // Log security event using SecurityUtils
    const securityLog = SecurityUtils.createSecurityLog(
      SecurityEventType.USER_LOGOUT,
      { reason, timestamp: new Date().toISOString() },
      'high'
    );
    SecurityUtils.logSecurityEvent(securityLog, this.securityConfig);

    // Xóa thông tin user
    this._user.next(null);
    
    // Clear storage based on config
    if (this.securityConfig.CLEAR_STORAGE_ON_LOGOUT) {
      if (!SecurityUtils.clearAllStorage()) {
        // Fallback to individual item removal
        SecurityUtils.removeStorageItems(['AuthToken', 'codeForOneUser', 'localConfig']);
      }
    }
    
    // Notify server về logout event
    this.notifyServerLogout(reason);
    
    // Redirect về login
    window.location.href = '/login';
  }
  sendMessageGlobal(object): Observable<any> {
    return this._httpClient.post(`${env.urlOperationApi}/ManagerUser/sendMessageGlobal`, object);
  }

  Checkrole(roles, user) {
    let lsRoles = roles.filter((x) => x.code !== 'Leader');
    if (lsRoles.length > 1) {
      let temp = lsRoles.find((x) => x.active);
      if (temp) {
        temp.active = true;
        this.switchRole(temp, user);
      } else {
        let temprode = roles.filter((x) => x.code !== 'Leader')[0];
        temprode.active = true;
        roles.forEach((vl) => {
          this.switchRole(vl, user);
        });
      }
    } else {
      roles.forEach((vl) => {
        vl.active = true;
        this.switchRole(vl, user);
      });
    }
  }
  switchRole(vl, user) {
    switch (vl.code) {
      case 'Admin':
        user.IsAdmin = vl.active;
        break;
      case 'AdminSystem':
        user.IsAdminSystem = true;
        break;
      case 'Reservation':
        user.IsReservation = vl.active;
        break;
      case 'Leader':
        user.IsReservationLeader = vl.active;
        user.IsLeader = vl.active;
        break;
      case 'ReservationManager':
        user.IsReservationLeader = vl.active;
        user.IsLeader = vl.active;
        break;
      case 'OM':
        user.IsOm = vl.active;
        break;
      case 'Product':
        user.IsProduct = vl.active;
        break;
      case 'View':
        user.IsView = vl.active;
        break;
      case 'User':
        user.IsUser = vl.active;
        break;
      case 'Report':
        user.IsReport = vl.active;
        break;
      case 'Operation':
        user.IsOperation = vl.active;
        break;
      case 'Accounting':
        user.IsAccounting = vl.active;
        break;
      case 'AccountingManager':
        user.IsAccountingManager = true;
        break;
      case 'FinanceManager':
        user.IsFinanceManager = true;
        break;
      case 'AccountsReceivable':
        user.IsAccountsReceivable = true;
        break;
      case 'AccountsPayable':
        user.IsAccountsPayable = true;
        break;
    }
  }
  update(user: any): Observable<any> {
    return this._httpClient.patch<User>('api/common/user', { user }).pipe(
      map((response) => {
        this._user.next(response);
      })
    );
  }

  syncConfig(): any {
    if (!!localStorage.getItem('localConfig')) return JSON.parse(localStorage.getItem('localConfig') ?? '');
    else {
      const config = {
        freezeNavbar: true,
        freezeHeader: false,
        freezeToolbar: false,
        freezeInformation: false,
        // ...
      };
      localStorage.setItem('localConfig', JSON.stringify(config));
      return config;
    }
  }
  saveConfig(config: any): boolean {
    localStorage.setItem('localConfig', JSON.stringify(config));
    return true;
  }

  // Notify server về logout event
  private notifyServerLogout(reason: string): void {
    try {
      // Fire and forget - không cần đợi response
      this._httpClient.post(`${env.urlOperationApi}/Security/NotifyLogout`, {
        reason,
        timestamp: new Date().toISOString()
      }).subscribe({
        error: (err) => console.warn('Failed to notify server about logout:', err)
      });
    } catch (error) {
      console.warn('Error notifying server about logout:', error);
    }
  }

  // Bắt đầu periodic security check
  private startSecurityCheckTimer(): void {
    // Clear existing timer nếu có
    if (this._securityCheckTimer) {
      clearInterval(this._securityCheckTimer);
    }

    // Chỉ chạy security check khi user đã login
    this._securityCheckTimer = setInterval(() => {
      this.user$.subscribe(user => {
        if (user && user.id) {
          this.performSecurityCheck();
        }
      });
    }, this.securityConfig.SECURITY_CHECK_INTERVAL);
  }

  // Thực hiện security check định kỳ
  private performSecurityCheck(): void {
    this._httpClient.get(`${env.urlOperationApi}/ManagerUser/BackendInfo`)
      .pipe(
        catchError((error) => {
          console.error('Periodic security check failed:', error);
          const securityLog = SecurityUtils.createSecurityLog(
            SecurityEventType.PERIODIC_CHECK_FAILED, 
            { error: error.message },
            'high'
          );
          SecurityUtils.logSecurityEvent(securityLog, this.securityConfig);
          return EMPTY;
        })
      )
      .subscribe((user: any) => {
        if (!SecurityUtils.validateUserSession(user)) {
          const reason = !user ? 'periodic_check_no_user' : 
                        user.deactive ? 'periodic_check_deactivated' : 
                        'periodic_check_license_revoked';
          this.logout(reason);
        } else {
          // Update user info nếu còn valid
          this._user.next(user);
        }
      });
  }

  // Clean up timer khi destroy service
  ngOnDestroy(): void {
    if (this._securityCheckTimer) {
      clearInterval(this._securityCheckTimer);
    }
  }
}
