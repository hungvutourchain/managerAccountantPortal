import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, of, timer, throwError } from "rxjs";
import { catchError, switchMap, map, shareReplay, takeWhile, filter, take, tap } from "rxjs/operators";
import { environment as env } from "environments/environment";
import md5 from "md5";
import * as _ from "lodash";

@Injectable()
export class DbService {
  constructor(private http: HttpClient) {}
  private cache = new Map<string, any>();

  private getDocumentConfig(origin: string = document.location.origin): Observable<any> {
    const cacheKey = `document-config:${origin}`;

    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    return this.http
      .get<any>(`${env.urlOperationApi}/Document/configPage?domain=${encodeURIComponent(origin)}`)
      .pipe(
        tap((config) => this.cache.set(cacheKey, config)),
        shareReplay(1)
      );
  }

  checkQRLoginStatus(qrData: string): Observable<any> {
    return this.http.get(
      `${env.urlOperationApi}/ManagerUser/CheckQRLoginStatus?qrData=${qrData}`,
    );
  }

  authenticateWithQR(qrData: string, userCredentials: any): Observable<any> {
    return this.http.post(`${env.urlOperationApi}/ManagerUser/AuthenticateQR`, {
      qrData: qrData,
      credentials: userCredentials,
    });
  }
  GetIP(): Observable<any> {
    return this.http.get<any>("https://jsonip.com");
  }
  userCheckIp(obj): Observable<any> {
    return this.http.get<any>(
      env.urlOperationApi +
        `/ManagerUser/userCheckIp?userId=${obj.userId}&ip=${obj.ip}`,
    );
  }

  // ============ STUB METHODS - Added to fix compilation errors ============

  // Lookup/Configuration Methods
  getCountries(): Observable<any> {
    return this.getDocumentConfig().pipe(
      map((config) => {
        const defaultCountry = (config?.defaultCountry || "vn").toString().toLowerCase();
        return [
          {
            name: (config?.countryName || defaultCountry || "VN").toString().toUpperCase(),
            nation: defaultCountry,
          },
        ];
      }),
      catchError(() =>
        of([
          {
            name: "VN",
            nation: "vn",
          },
        ])
      )
    );
  }

  getAdminImage(origin: string): Observable<any> {
    return of({
      defaultCountry: "vn",
      nameCompany: "Accountant Portal",
      imageLogo: "./assets/images/logo/accountant-portal-logo.svg",
      linkAdmin: origin || document.location.origin,
    });
  }

  getLanguageCodes(): Observable<any> {
    return of([]);
  }

  getLicenseTypes(): Observable<any> {
    return of([]);
  }

  getExchangeRates(nation: string, param: boolean): Observable<any> {
    return of([]);
  }

  // User Settings
  GetUsersSeting(nation: string): Observable<any> {
    return of([]);
  }

  AddUsersSeting(object: any): Observable<any> {
    return of({});
  }

  UpdateUsersSeting(object: any): Observable<any> {
    return of({});
  }

  RemoveUsersSeting(object: any): Observable<any> {
    return of({});
  }

  // Form Methods
  LoadAgencyForm(value: string): Observable<any> {
    return of({});
  }

  pushForm(object: any): Observable<any> {
    return of({});
  }

  // Class Management
  GetClass(nation: string): Observable<any> {
    return of([]);
  }

  AddClass(object: any): Observable<any> {
    return of({});
  }

  UpdateClass(object: any): Observable<any> {
    return of({});
  }

  RemoveClass(object: any): Observable<any> {
    return of({});
  }

  // Course Management
  GetCourse(nation: string): Observable<any> {
    return of([]);
  }

  AddCourse(object: any): Observable<any> {
    return of({});
  }

  UpdateCourse(object: any): Observable<any> {
    return of({});
  }

  RemoveCourse(object: any): Observable<any> {
    return of({});
  }

  // Department Management
  GetDepartment(nation: string): Observable<any> {
    return of([]);
  }

  AddDepartment(object: any): Observable<any> {
    return of({});
  }

  UpdateDepartment(object: any): Observable<any> {
    return of({});
  }

  RemoveDepartment(object: any): Observable<any> {
    return of({});
  }

  // Company Management
  GetCompany(nation: string): Observable<any> {
    return of([]);
  }

  AddCompany(object: any): Observable<any> {
    return of({});
  }

  UpdateCompany(object: any): Observable<any> {
    return of({});
  }

  RemoveCompany(object: any): Observable<any> {
    return of({});
  }

  // Student Group Management
  GetStudentGroup(filter: any): Observable<any> {
    return of([]);
  }

  AddStudentGroup(object: any): Observable<any> {
    return of({});
  }

  UpdateStudentGroup(object: any): Observable<any> {
    return of({});
  }

  RemoveStudentGroup(object: any): Observable<any> {
    return of({});
  }

  // Template Email Student
  GetTemplateEmailStudent(nation: string): Observable<any> {
    return of([]);
  }

  AddTemplateEmailStudent(object: any): Observable<any> {
    return of({});
  }

  UpdateTemplateEmailStudent(object: any): Observable<any> {
    return of({});
  }

  RemoveTemplateEmailStudent(object: any): Observable<any> {
    return of({});
  }

  // License Management
  GetLicenseUsageReport(query: any): Observable<any> {
    return of([]);
  }

  GetLicenseUsageSummary(query: any): Observable<any> {
    return of({});
  }

  GetExpiredLicenses(query: any): Observable<any> {
    return of([]);
  }

  GetLicenseExpirationReport(query: any): Observable<any> {
    return of([]);
  }

  GetUserLicenseDetails(query: any): Observable<any> {
    return of({});
  }

  getUserLicenses(userId: string): Observable<any> {
    return of([]);
  }

  updateUserLicense(data: any): Observable<any> {
    return of({});
  }

  revokeLicense(data: any): Observable<any> {
    return of({});
  }

  UpdatelicenseTypes(data: any): Observable<any> {
    return of({});
  }

  // Email & Verification
  CheckEmailUser(email: string, nation: string): Observable<any> {
    return this.http.get<any>(
      `${env.urlOperationApi}/ManagerUser/CheckEmailUser?email=${encodeURIComponent(email)}&nation=${encodeURIComponent(nation || "")}`
    );
  }

  SendEmailVerify(object: any): Observable<any> {
    return this.http.post<any>(`${env.urlOperationApi}/ManagerUser/SendEmailVerify`, object).pipe(
      catchError(() =>
        this.http.post<any>(`${env.urlOperationApi}/Authenticate/send-email-verify`, object)
      )
    );
  }

  notifyApiUrl(emails: any): Observable<any> {
    return of({});
  }

  // QR & TOTP
  generateQrCode(email: string): Observable<any> {
    const payload = { email };
    return this.http.post<any>(`${env.urlOperationApi}/AuthServiceGoogle/generateQrCode`, payload).pipe(
      catchError(() => this.http.post<any>(`${env.urlOperationApi}/ManagerUser/generateQrCode`, payload)),
      catchError(() => this.http.get<any>(`${env.urlOperationApi}/AuthServiceGoogle/generateQrCode?email=${encodeURIComponent(email)}`))
    );
  }

  validateTotp(secret: string, totp: string): Observable<any> {
    const payload = { secret, otp: totp };
    return this.http.post<any>(`${env.urlOperationApi}/AuthServiceGoogle/validateTotp`, payload).pipe(
      catchError(() => this.http.post<any>(`${env.urlOperationApi}/AuthServiceGoogle/userVerify`, { Key: secret, otp: totp })),
      catchError(() => this.http.get<any>(
        `${env.urlOperationApi}/ManagerUser/validateTotp?secret=${encodeURIComponent(secret)}&totp=${encodeURIComponent(totp)}`
      ))
    );
  }

  bindUserTwoFactorSecret(userId: string, secret: string, enabled: boolean): Observable<any> {
    return this.http.post<any>(`${env.urlOperationApi}/AuthServiceGoogle/bind-user-secret`, {
      userId,
      secret,
      enabled,
    });
  }

  // User Management
  getUsers(nation: string, param: boolean): Observable<any> {
    return of([]);
  }

  ConfigAdmin(): Observable<any> {
    return of({});
  }

  // System Operations
  getFeatureFlag(setting: string): Observable<any> {
    return of({});
  }

  getSettingView(setting: string): Observable<any> {
    return of({});
  }

  UserCheckLoginBackendWidget(object: any): Observable<any> {
    return of({});
  }

  ClearCachingRedis(): Observable<any> {
    return of({});
  }

  // File & Image Operations
  uploadPinturaProcessedImage(formData: any): Observable<any> {
    return of({});
  }

  pushFileImage(object: any): Observable<any> {
    return of({});
  }

}
