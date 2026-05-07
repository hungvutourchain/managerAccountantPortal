import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, pipe } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DbService } from 'app/shared/connectData/db.service';
@Injectable({
  providedIn: 'root',
})
export class FeatureFlagManagerService {
  private _featureFlags: ReplaySubject<any> = new ReplaySubject<any>(1);
  // private _localConfig: ReplaySubject<any> = new ReplaySubject<any>(1);

  /**
   * Constructor
   */
  constructor(private _httpClient: HttpClient, private dbService: DbService) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter & getter for featureFlags
   *
   * @param value
   */
  set featureFlags(value: any) {
    // Store the value
    this._featureFlags.next(value);
  }

  get featureFlags$(): Observable<any> {
    return this._featureFlags.asObservable();
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
    return this.dbService.getFeatureFlag('Reservation').pipe(
      tap(async (rs: any) => {
        this._featureFlags.next(rs);
      })
    );
  }
}
