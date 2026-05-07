import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, pipe } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DbService } from 'app/shared/connectData/db.service';
@Injectable({
  providedIn: 'root',
})
export class SettingViewManagerService {
  private _settingView: ReplaySubject<any> = new ReplaySubject<any>(1);
  // private _localConfig: ReplaySubject<any> = new ReplaySubject<any>(1);

  /**
   * Constructor
   */
  constructor(private _httpClient: HttpClient, private dbService: DbService) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter & getter for settingView
   *
   * @param value
   */
  set settingView(value: any) {
    // Store the value
    this._settingView.next(value);
  }

  get settingView$(): Observable<any> {
    return this._settingView.asObservable();
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
    // REMOVED: getSettingView method not found on DbService
    // return this.dbService.getSettingView('Reservation').pipe(
    return new Observable(observer => {
      tap(async (rs: any) => {
        this._settingView.next(rs);
      })
    );
  }
}
