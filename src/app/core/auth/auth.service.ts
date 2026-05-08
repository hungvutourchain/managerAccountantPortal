import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { environment as env } from 'environments/environment';
import { DeviceDetectorService } from 'ngx-device-detector';
import { LocalStorageService } from 'angular-web-storage';
import { AppFactory } from 'app/shared/lib/common.service';
import { 
  DEFAULT_SECURITY_CONFIG, 
  SecurityConfig, 
  SecurityEventType, 
  SecurityUtils 
} from 'app/core/security/security.config';
// data indexedDB

@Injectable()
export class AuthService {
  private _authenticated: boolean = false;
  private readonly securityConfig: SecurityConfig = DEFAULT_SECURITY_CONFIG;

  /**
   * Constructor
   */
  deviceInfo: any
  constructor(
    private local: LocalStorageService,
    private _httpClient: HttpClient,
    private deviceService: DeviceDetectorService,
    private _userService: UserService,
    public afac: AppFactory,
  ) {
    this.deviceInfo = this.deviceService.getDeviceInfo();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter & getter for access token
   */
  set accessToken(token: string) {
    localStorage.setItem('AuthToken', token);
  }

  get accessToken(): string {
    return localStorage.getItem('AuthToken') ?? '';
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Forgot password
   *
   * @param email
   */
  forgotPassword(email: string): Observable<any> {
    return this._httpClient.post('api/auth/forgot-password', email);
  }

  /**
   * Reset password
   *
   * @param password
   */
  resetPassword(password: string): Observable<any> {
    return this._httpClient.post('api/auth/reset-password', password);
  }

  userVerify(userId: string, numberVerify: string, isGoogle: boolean, numberGoogleVerify: any = ''): Observable<any> {
    return Observable.create(observer => {
      this._httpClient.post(env.urlOperationApi + `/ManagerUser/userVerify`, {
        userId,
        numberVerify,
        isGoogle,
        numberGoogleVerify,
      }).subscribe((rs: any) => {
        observer.next(rs);
      })
    });
  }

  userVerifyGoogle(userId: string, numberVerify: string): Observable<any> {
    return Observable.create(observer => {
      this._httpClient.post(env.urlOperationApi + `/AuthServiceGoogle/userVerify`, { Key: userId, otp: numberVerify }).subscribe((rs: any) => {
        observer.next(rs);
      })
    });
  }
  signIn(credentials: any, changeNation: boolean = false, ip: any = {}): Observable<any> {
    // Throw error, if the user is already logged in
    if (!changeNation)
      if (this._authenticated) {
        return throwError('User is already logged in.');
      }
    const payload = {
      username: credentials?.username || '',
      password: credentials?.password || '',
    };

    return this._httpClient.post(`${env.urlOperationApi}/Authenticate/authenticate`, payload).pipe(
      switchMap((response: any) => {
        // Store the access token in the local storage
        const token = response?.token || response?.Token;
        const idUser = response?.idUser || response?.IdUser || response?.id || response?.Id || null;

        if (token) {
          this.accessToken = token;
          // Set the authenticated flag to true
          this._authenticated = true;
          // Store the user on the user service
          this._userService.user = this._buildDocumentUser(token, undefined, idUser);
          // Return a new observable with the response
          return of({ ...response, token, idUser });
        }
        else return of(response);
      })
    );
  }

  /**
   * Sign in using the access token
   */
  signInUsingToken(): Observable<any> {
    // Renew token
    const token = localStorage.getItem('AuthToken') ?? '';
    if (token) {
      const token = localStorage.getItem('AuthToken') ?? '';
      let objToken = AuthUtils.deCodeToken(token)
      if (this._isSupportedToken(objToken)) {
        this.accessToken = token
        this._authenticated = true;
        this._userService.user = this._buildDocumentUser(token, objToken?.Nation, objToken?.Id);
        return of(true);
      } else return of(false);
    } else {
      return of(true);
    }
  }

  /**
   * Sign out
   */
  signOut(): Observable<any> {
    // Log security event
    this.logSecurityEvent(SecurityEventType.USER_LOGOUT, {
      timestamp: new Date().toISOString(),
      reason: 'manual_signout'
    }, 'medium');

    // Remove the access token from the local storage
    try {
      localStorage.removeItem('AuthToken');
      
      // Clear additional sensitive data
      localStorage.removeItem('userSession');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('localConfig');
      
      // Clear all local storage để đảm bảo security
      // SecurityUtils.clearAllStorage(); // Uncomment nếu muốn clear toàn bộ
    } catch (error) {
      console.error('Error during sign out cleanup:', error);
    }

    // Set the authenticated flag to false
    this._authenticated = false;

    // Return the observable
    return of(true);
  }

  /**
   * Sign up
   *
   * @param user
   */
  signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
    return this._httpClient.post('api/auth/sign-up', user);
  }

  /**
   * Unlock session
   *
   * @param credentials
   */
  unlockSession(credentials: { email: string; password: string }): Observable<any> {
    return this._httpClient.post('api/auth/unlock-session', credentials);
  }

  /**
   * Check the authentication status
   */
  check(): Observable<boolean> {
    try {
      // Check if the user is logged in
      if (this._authenticated) {
        const token = localStorage.getItem('AuthToken') ?? '';
        let objToken = AuthUtils.deCodeToken(token);
        
        if (!objToken) {
          this.logSecurityEvent(SecurityEventType.TOKEN_INVALID, { reason: 'decode_failed' }, 'high');
          this._authenticated = false;
          return of(false);
        }
        
        if (!this._isSupportedToken(objToken)) {
          this.logSecurityEvent(SecurityEventType.TOKEN_INVALID, { reason: 'not_backend_token' }, 'high');
          return of(false);
        }
        
        return of(true);
      }
      
      // Check the access token availability
      if (!this.accessToken) {
        this.logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, { reason: 'no_access_token' }, 'medium');
        return of(false);
      }

      // Check the access token expire date
      if (AuthUtils.isTokenExpired(this.accessToken)) {
        this.logSecurityEvent(SecurityEventType.TOKEN_EXPIRED, { 
          reason: 'token_expired',
          token_preview: this.accessToken.substring(0, 10) + '...'
        }, 'medium');
        
        // Clear expired token
        localStorage.removeItem('AuthToken');
        this._authenticated = false;
        return of(false);
      }
      
      // If the access token exists and it didn't expire, sign in using it
      return this.signInUsingToken();
      
    } catch (error: any) {
      this.logSecurityEvent(SecurityEventType.SECURITY_CHECK_ERROR, { 
        error: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      }, 'high');
      
      // Clear potentially corrupted data
      localStorage.removeItem('AuthToken');
      this._authenticated = false;
      return of(false);
    }
  }

  /**
   * Log security events
   */
  private logSecurityEvent(
    event: SecurityEventType | string, 
    data?: any, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const securityLog = SecurityUtils.createSecurityLog(event, data, severity);
    SecurityUtils.logSecurityEvent(securityLog, this.securityConfig);
  }

  private _isSupportedToken(decodedToken: any): boolean {
    return !!decodedToken && !!(decodedToken.BackEnd || decodedToken.Id || decodedToken.IdAgency || decodedToken.Nation);
  }

  private _buildDocumentUser(token: string, nation?: string, idUser?: string | null): any {
    const decodedToken = AuthUtils.deCodeToken(token) || {};

    return {
      _id: idUser || decodedToken.Id || '',
      id: idUser || decodedToken.Id || '',
      idAgency: decodedToken.IdAgency || '',
      nation: nation || decodedToken.Nation || '',
      username: idUser || decodedToken.Id || 'document-user',
      role: [],
      licensed: true,
      deactive: false,
      isviewAdmin: false,
    };
  }
}
