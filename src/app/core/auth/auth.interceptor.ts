import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { SecurityUtils } from 'app/core/security/security.config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor
{
    /**
     * Constructor
     */
    constructor(private _authService: AuthService)
    {
    }

    /**
     * Intercept
     *
     * @param req
     * @param next
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
    {
        // Clone the request object
        let newReq = req.clone();

        // Request
        //
        // If the access token didn't expire, add the Authorization header.
        // We won't add the Authorization header if the access token expired.
        // This will force the server to return a "401 Unauthorized" response
        // for the protected API routes which our response interceptor will
        // catch and delete the access token from the local storage while logging
        // the user out from the app.
        if ( this._authService.accessToken && !AuthUtils.isTokenExpired(this._authService.accessToken) )
        {
            newReq = req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + this._authService.accessToken)
            });
        }

        // Response
        return next.handle(newReq).pipe(
            catchError((error) => {
                // Log security error
                this.logSecurityError(error, req.url);

                // Catch "401 Unauthorized" responses
                if ( error instanceof HttpErrorResponse && error.status === 401 )
                {
                    console.warn('401 Unauthorized detected, signing out user');
                    
                    // Sign out
                    this._authService.signOut();

                    // Clear all storage to prevent data leakage
                    try {
                        SecurityUtils.clearAllStorage();
                    } catch (storageError) {
                        console.error('Error clearing storage on 401:', storageError);
                    }

                    // Reload the app
                    location.reload();
                }

                // Handle other security-relevant status codes
                if (error instanceof HttpErrorResponse && (error.status === 403 || error.status === 429)) {
                    console.warn(`Security-relevant HTTP ${error.status} detected:`, error);
                }

                return throwError(error);
            })
        );
    }

    /**
     * Log security-related HTTP errors
     */
    private logSecurityError(error: any, url: string): void {
        if (error instanceof HttpErrorResponse) {
            const securityLog = {
                event: 'http_security_error',
                timestamp: new Date().toISOString(),
                status: error.status,
                statusText: error.statusText,
                url: url,
                userAgent: navigator.userAgent,
                message: error.message
            };
            
            // Log based on severity
            if (error.status === 401 || error.status === 403) {
                console.error('[HOTEL_SECURITY ERROR]', securityLog);
            } else if (error.status === 429) {
                console.warn('[HOTEL_RATE LIMIT]', securityLog);
            }
        }
    }
}