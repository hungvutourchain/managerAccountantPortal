import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Route, 
    Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { switchMap, catchError } from 'rxjs/operators';
import { SecurityEventType, SecurityUtils, DEFAULT_SECURITY_CONFIG } from 'app/core/security/security.config';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad
{
    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _router: Router
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Can activate
     *
     * @param route
     * @param state
     */
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean
    {
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        return this._check(redirectUrl);
    }

    /**
     * Can activate child
     *
     * @param childRoute
     * @param state
     */
    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        return this._check(redirectUrl);
    }

    /**
     * Can load
     *
     * @param route
     * @param segments
     */
    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean
    {
        return this._check('/');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Check the authenticated status
     *
     * @param redirectURL
     * @private
     */
    private _check(redirectURL: string): Observable<boolean>
    {
        // Check the authentication status
        return this._authService.check()
                   .pipe(
                       switchMap((authenticated) => {

                           // If the user is not authenticated...
                           if ( !authenticated )
                           {
                               // Log security event
                               const securityLog = SecurityUtils.createSecurityLog(
                                   SecurityEventType.UNAUTHORIZED_ACCESS,
                                   { 
                                       attempted_url: redirectURL,
                                       reason: 'not_authenticated'
                                   },
                                   'medium'
                               );
                               SecurityUtils.logSecurityEvent(securityLog, DEFAULT_SECURITY_CONFIG);

                               // Redirect to the sign-in page
                               this._router.navigate(['landing'], {queryParams: {redirectURL}});

                               // Prevent the access
                               return of(false);
                           }

                           // Allow the access
                           return of(true);
                       }),
                       catchError((error) => {
                           // Log security error
                           const securityLog = SecurityUtils.createSecurityLog(
                               'auth_guard_error',
                               { 
                                   error: error?.message || 'Unknown error',
                                   attempted_url: redirectURL 
                               },
                               'high'
                           );
                           SecurityUtils.logSecurityEvent(securityLog, DEFAULT_SECURITY_CONFIG);

                           // Redirect to landing on error
                           this._router.navigate(['landing']);
                           return of(false);
                       })
                   );
    }
}
