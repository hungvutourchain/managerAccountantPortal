import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment as env } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LicenseService {
  constructor(private http: HttpClient) {}

  // Phương thức để gia hạn license
  renewLicense(licenseId: string): Observable<any> {
    return this.http.post(env.urlOperationApi + '/SettingUser/Renew', { licenseId });
  }

  // Các phương thức khác liên quan đến license management
  getLicenseUsageReport(): Observable<any> {
    return this.http.get(env.urlOperationApi + '/SettingUser/GetUsageReport');
  }

  getExpiredLicenses(page: number, pageSize: number): Observable<any> {
    return this.http.post(env.urlOperationApi + '/SettingUser/GetExpiredLicenses', {
      page,
      pageSize,
    });
  }

  getLicenseExpirationReport(): Observable<any> {
    return this.http.get(env.urlOperationApi + '/SettingUser/GetExpirationReport');
  }

  getUserLicenseDetails(userId: string): Observable<any> {
    return this.http.post(env.urlOperationApi + '/SettingUser/GetUserLicenseDetails', { userId });
  }

  sendReminderEmail(licenseData: any): Observable<any> {
    return this.http.post(env.urlOperationApi + '/SettingUser/SendReminderEmail', licenseData);
  }

  editLicense(licenseData: any): Observable<any> {
    return this.http.post(env.urlOperationApi + '/SettingUser/EditLicense', licenseData);
  }

  revokeLicense(licenseId: string): Observable<any> {
    return this.http.post(env.urlOperationApi + '/SettingUser/RevokeLicense', { licenseId });
  }

  // Add this method to the LicenseService
  updateLicense(licenseData: any) {
    // Assuming you have an endpoint for updating licenses
    return this.http.put<any>(`${env.urlOperationApi}/SettingUser/update`, licenseData);
  }
  addLicense(licenseData: any): Observable<any> {
    return this.http.post<any>(`${env.urlOperationApi}/SettingUser`, licenseData);
  }
}
