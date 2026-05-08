import { Component, OnChanges, EventEmitter, ViewEncapsulation, Input, Output } from '@angular/core';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment as env } from 'environments/environment';
import md5 from 'md5';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';
import { DbService } from 'app/shared/connectData/db.service';
import { AppFactory } from 'app/shared/lib/common.service';
@Component({
  standalone: false,
  selector: 'profile-dialog',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProfileComponent implements OnChanges {
  @Input() user: any;
  feature: any = {};
  @Input() dateTimeFormat: string;
  @Output() out = new EventEmitter<boolean>();
  @Output() refresh = new EventEmitter();
  object: any = {};
  _user: any = {};
  private isLoadingProfile = false;
  private lastLoadedUserKey = '';

  old_nm: any = false;
  old_m: any = false;
  nc_nm: any = false;
  nc_m: any = false;
  roundTypes: any = [
    {
      type: 'Round',
      digit: 0,
    },
    {
      type: 'RoundUp',
      digit: 0,
    },
    {
      type: 'Origin',
      digit: 0,
    },
  ];
  activeTab: number = 1;
  public headerText: any = [{ text: 'Info' }, { text: 'Change Password' }, { text: 'Signature' }];
  public insertImageSettings = {
    display: 'Block',
  };
  private hostUrl: string = document.location.origin + env.syncFileManagerLocal;
  public fileManagerSettings: any = {};
  constructor(
    private snackBar: MatSnackBar,
    private router: Router,
    private http: HttpClient,
    public afac: AppFactory,
    private dbService: DbService,
    private _userService: UserService
  ) {
    this.feature = this.afac.getFeatureFlags();
    this.fileManager();
  }

  fileManager() {
    this.fileManagerSettings = {
      enable: true,
      ajaxSettings: {
        url: this.hostUrl + '/api/FileManager/FileOperations',
        getImageUrl: this.hostUrl + '/api/FileManager/GetImage',
        downloadUrl: this.hostUrl + '/api/FileManager/Download',
        uploadUrl: this.hostUrl + '/api/FileManager/Upload',
      },
    };
  }
  keyWordInvoiceExport: any = [
    '{InvoiceNumber}',
    '{InvoiceName}',
    '{BookingCode}',
    '{BookingVersion}',
    '{BookingName}',
    '{AgentName}',
    '{ExportDate}',
  ];
  keyWordDocumentExport: any = ['{BookingCode}', '{BookingVersion}', '{BookingName}', '{AgentName}', '{ExportDate}'];
  ngOnChanges() {
    try {
      if (!this.user) {
        return;
      }

      const currentUserKey = this.resolveUserId(this.user) || this.user?.email || '';

      // Avoid API storm when parent emits the same user repeatedly.
      if (this.isLoadingProfile) {
        return;
      }

      if (currentUserKey && currentUserKey === this.lastLoadedUserKey && this._user?._id) {
        this._user = this.normalizeProfileUser({ ...this._user, ...this.user });
        return;
      }

      this.loadProfileFromApis();
    } catch (err) {
      console.log('Load data fail!', err);
    }
  }
  lsLanguageCodes: any[] = [];
  loadingLanguages: boolean = false;
  async initLanguageCodes() {
    this.loadingLanguages = true;
    if (!this.lsLanguageCodes?.length) {
      this.lsLanguageCodes = await this.dbService.getLanguageCodes().toPromise();
    }
    this.loadingLanguages = false;
  }
  public qrCodeBase64: string;
  public secretKey: string;
  totp: string;
  loadinggenerateQrCode = true;
  isVerifyingTotp = false;
  isUpdatingTwoFactor = false;
  generateQrCode(): void {
    this.loadinggenerateQrCode = true;
    const email = this._user?.email || this.user?.email;
    if (!email) {
      this.loadinggenerateQrCode = false;
      return;
    }

    this.dbService.generateQrCode(email).subscribe({
      next: (response: any) => {
        this.qrCodeBase64 = response?.qrCodeBase64 || '';
        this.secretKey = response?.secretKey || '';
        this.loadinggenerateQrCode = false;
      },
      error: () => {
        this.qrCodeBase64 = '';
        this.secretKey = '';
        this.loadinggenerateQrCode = false;
        this.notifi('error', 'Cannot generate 2FA QR code. / Không thể tạo mã QR 2FA.');
      },
    });
  }
  totpInvalid: boolean = false;
  validateTotp(): void {
    const otpCode = String(this.totp || '').trim();

    if (!this.secretKey) {
      this.notifi('error', 'Missing 2FA secret key. / Thiếu secret key 2FA.');
      this.generateQrCode();
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      this.totpInvalid = true;
      this.notifi('warn', 'OTP must be 6 digits. / Mã OTP phải gồm 6 số.');
      return;
    }

    if (this.isVerifyingTotp || this.isUpdatingTwoFactor) {
      return;
    }

    this.isVerifyingTotp = true;
    this.dbService.validateTotp(this.secretKey, otpCode).subscribe({
      next: (response: any) => {
        const isValid = response === true || response?.valid === true || response?.success === true;
        if (!isValid) {
          this.totpInvalid = true;
          this.notifi('error', 'Invalid OTP. / Mã OTP không hợp lệ.');
          return;
        }

        this.totpInvalid = false;
        this._user.twoFAGoogle = true;
        this._user.SecretKey = this.secretKey;
        this.persistTwoFactorState(true);
      },
      error: () => {
        this.totpInvalid = true;
        this.notifi('error', 'OTP validation failed. / Xác thực OTP thất bại.');
      },
      complete: () => {
        this.isVerifyingTotp = false;
      },
    });
  }
  disable2FA() {
    if (this.isUpdatingTwoFactor) {
      return;
    }

    this._user.twoFAGoogle = false;
    this._user.SecretKey = '';
    this.persistTwoFactorState(false);
  }
  CurrencySelected: any = [];
  GetCurrencySelectedAsync() {
    const nation = this.resolveUserNation(this._user || this.user);
    const userCurrency = this._user?.currency || this.user?.currency;

    if (!nation) {
      this.CurrencySelected = userCurrency ? [userCurrency] : [];
      return;
    }

    this.http.get(env.urlOperationApi + '/Config/CurrencySelectedsAsync?nation=' + nation).subscribe({
      next: (rs: any) => {
        const currencies = Array.isArray(rs) ? rs : [];
        this.CurrencySelected = [...currencies];

        if (userCurrency && !this.CurrencySelected.includes(userCurrency)) {
          this.CurrencySelected.push(userCurrency);
        }
      },
      error: () => {
        this.CurrencySelected = userCurrency ? [userCurrency] : [];
      },
    });
  }
  Checkoldpass(pass) {
    let x = _.cloneDeep(pass);
    if (this.user.pass === md5(x)) {
      this.old_m = true;
      this.old_nm = false;
    } else {
      this.old_m = false;
      this.old_nm = true;
    }
  }
  toolbarset: object = {
    type: 'MultiRow',
    enableFloating: true,
    items: [
      'image',
      'FileManager',
      '|',
      'Bold',
      'Italic',
      'Underline',
      'StrikeThrough',
      'FontName',
      'FontSize',
      'FontColor',
      'BackgroundColor',
      'LowerCase',
      'UpperCase',
      'SuperScript',
      'SubScript',
      '|',
      'Formats',
      'Alignments',
      'OrderedList',
      'UnorderedList',
      'Outdent',
      'Indent',
      '|',
      'createTable',
      '|',
      'CreateLink',
      'ClearFormat',
      'clearAll',
      'Print',
      'SourceCode',
      'FullScreen',
      '|',
      'Undo',
      'Redo',
    ],
  };
  checkConfirm(_new, confirm) {
    if (_new === confirm) {
      this.nc_m = true;
      this.nc_nm = false;
    } else {
      this.nc_m = false;
      this.nc_nm = true;
    }
  }
  funProfile(action, item) {
    switch (action) {
      case 'save':
        this.saveUserSettings(this._user, false);
        break;
      case 'change_pass':
        if (this.nc_m && this.old_m) {
          this._user.pass = _.cloneDeep(this.object.confirm);
          this._user.pass = md5(this._user.pass);
          this.saveUserSettings(this._user, true);
        } else {
          alert("Password does't match.");
        }
        break;
      case 'close':
        this.out.emit(true);
        break;
    }
  }
  logout(): void {
    this.router.navigate(['/sign-out']);
  }
  navigate(link): void {
    this.router.navigate([link]);
  }
  notifi(type, mes, time = 3000, confirm = 'OK'): void {
    this.snackBar.open(mes, confirm, {
      duration: time,
    });
  }
  changeTab($event) {
    this.activeTab = $event;
    if (this.activeTab === 5) {
      this.initLanguageCodes();
    }
  }
  // config name export file
  // Default templates
  // Default templates - cập nhật theo keywords mới
  defaultInvoiceTemplate = '{InvoiceNumber}_{BookingCode}_{ExportDate}';
  defaultDocumentTemplate = '{BookingCode}_{BookingName}_{ExportDate}';

  // Available keywords for each type
  invoiceKeywords = ['{InvoiceNumber}', '{ExportDate}', '{AgentName}', '{AccountName}', '{DueDate}', '{UserName}'];

  documentKeywords = ['{DocumentType}', '{ExportDate}', '{UserName}', '{TourCode}', '{BookingRef}', '{AgentName}'];
  /**
   * Generate preview filename based on template
   */
  getPreviewFileName(type: 'invoice' | 'document'): string {
    const currentDate = new Date().toISOString().split('T')[0];

    if (type === 'invoice') {
      const template = this._user.settingExportInvoice || this.defaultInvoiceTemplate;
      return (
        template
          .replace('{InvoiceNumber}', 'INV-2024-001')
          .replace('{InvoiceName}', 'Sample Invoice Name')
          .replace('{BookingCode}', 'BK-2024-001')
          .replace('{BookingVersion}', 'V1.0')
          .replace('{BookingName}', 'Sample Booking Name')
          .replace('{AgentName}', 'Sample Agent')
          .replace('{ExportDate}', currentDate) + '.xlsx'
      );
    } else {
      const template = this._user.settingExportDocument || this.defaultDocumentTemplate;
      return (
        template
          .replace('{BookingCode}', 'BK-2024-001')
          .replace('{BookingVersion}', 'V1.0')
          .replace('{BookingName}', 'Sample Booking Name')
          .replace('{AgentName}', 'Sample Agent')
          .replace('{ExportDate}', currentDate) + '.docx'
      );
    }
  }

  /**
   * Reset to default templates
   */
  resetToDefault(type: 'invoice' | 'document') {
    if (type === 'invoice') {
      this._user.settingExportInvoice = this.defaultInvoiceTemplate;
    } else {
      this._user.settingExportDocument = this.defaultDocumentTemplate;
    }
  }

  private loadProfileFromApis(): void {
    if (this.isLoadingProfile) {
      return;
    }

    this.isLoadingProfile = true;

    this._userService.get().subscribe({
      next: (rs: any) => {
        const profile = this.extractResponseData(rs) || this.user || {};
        this._user = this.normalizeProfileUser({ ...this.user, ...profile });
        this.lastLoadedUserKey = this.resolveUserId(this._user) || this._user?.email || this.lastLoadedUserKey;
        this.applyProfileDefaults();
        this.isLoadingProfile = false;
      },
      error: () => {
        const userId = this.resolveUserId(this.user);
        if (!userId) {
          this._user = this.normalizeProfileUser({ ...this.user });
          this.lastLoadedUserKey = this.resolveUserId(this._user) || this._user?.email || this.lastLoadedUserKey;
          this.applyProfileDefaults();
          this.isLoadingProfile = false;
          return;
        }

        this.http.get(env.urlOperationApi + '/SettingUser/GetUsersByID?id=' + userId).subscribe({
          next: (rs: any) => {
            const profile = this.extractResponseData(rs) || this.user || {};
            this._user = this.normalizeProfileUser({ ...this.user, ...profile });
            this.lastLoadedUserKey = this.resolveUserId(this._user) || this._user?.email || this.lastLoadedUserKey;
            this.applyProfileDefaults();
            this.isLoadingProfile = false;
          },
          error: () => {
            this._user = this.normalizeProfileUser({ ...this.user });
            this.lastLoadedUserKey = this.resolveUserId(this._user) || this._user?.email || this.lastLoadedUserKey;
            this.applyProfileDefaults();
            this.isLoadingProfile = false;
          },
        });
      },
    });
  }

  private applyProfileDefaults(): void {
    if (!this._user.signature) this._user.signature = '';
    if (!this._user.programConfig) this._user.programConfig = 'DUR-USE-NUM';
    if (!this._user.overnightConfig) this._user.overnightConfig = 'DUR-MAK-LCT-USE-NUM';
    if (!this._user.numberConfig) this._user.numberConfig = 'xxxxx';
    if (!this._user.settingExportInvoice) {
      this._user.settingExportInvoice = this.defaultInvoiceTemplate;
    }
    if (!this._user.settingExportDocument) {
      this._user.settingExportDocument = this.defaultDocumentTemplate;
    }

    this._user.twoFAGoogle = !!this._user.twoFAGoogle;
    this._user.SecretKey = this._user.SecretKey || '';

    if (!this._user?.twoFAGoogle) {
      this.generateQrCode();
    } else {
      this.loadinggenerateQrCode = false;
    }
  }

  private saveUserSettings(payload: any, logoutAfterSave: boolean): void {
    this.saveUserSettingsRequest(payload).subscribe({
      next: () => {
        alert(logoutAfterSave ? 'Change Password Success!' : 'Change Successfully!');
        this.refresh.emit();
        if (logoutAfterSave) {
          this.logout();
        }
      },
      error: () => {
        alert('Save failed! / Không thể lưu dữ liệu hồ sơ.');
      },
    });
  }

  private persistTwoFactorState(enabled: boolean): void {
    if (this.isUpdatingTwoFactor) {
      return;
    }

    this.isUpdatingTwoFactor = true;
    this.saveUserSettingsRequest(this._user).subscribe({
      next: () => {
        this._user.twoFAGoogle = enabled;
        this._user.SecretKey = enabled ? this.secretKey : '';
        const userId = this.resolveUserId(this._user);
        if (userId) {
          this.dbService.bindUserTwoFactorSecret(userId, this._user.SecretKey, enabled).subscribe({
            next: () => {
              this.refresh.emit();
              this.notifi('success', enabled
                ? 'Two-Factor Authentication enabled successfully.'
                : 'Two-Factor Authentication disabled successfully.');

              if (!enabled) {
                this.totp = '';
                this.totpInvalid = false;
                this.generateQrCode();
              }
            },
            error: () => {
              this.notifi('warn', '2FA saved but secret sync failed. / Đã lưu 2FA nhưng đồng bộ secret thất bại.');
            },
          });
        } else {
          this.refresh.emit();
          this.notifi('success', enabled
            ? 'Two-Factor Authentication enabled successfully.'
            : 'Two-Factor Authentication disabled successfully.');

          if (!enabled) {
            this.totp = '';
            this.totpInvalid = false;
            this.generateQrCode();
          }
        }
      },
      error: () => {
        this.notifi('error', 'Cannot update 2FA settings. / Không thể cập nhật cài đặt 2FA.');
      },
      complete: () => {
        this.isUpdatingTwoFactor = false;
      },
    });
  }

  private saveUserSettingsRequest(payload: any): Observable<any> {
    return this.http.put(env.urlOperationApi + '/Authenticate/info', payload).pipe(
      catchError(() => this.http.put(env.urlOperationApi + '/SettingUser/UpdateUsersSeting', payload))
    );
  }

  private extractResponseData(response: any): any {
    if (!response) {
      return null;
    }

    if (response.data && typeof response.data === 'object') {
      return response.data;
    }

    return response;
  }

  private resolveUserId(source: any): string {
    const candidates = [source?._id, source?.id, source?.Id, source?.userId];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }

      if (candidate && typeof candidate === 'object') {
        const objectCandidate = candidate as Record<string, unknown>;
        const nested = [objectCandidate.$oid, objectCandidate.oid, objectCandidate.id, objectCandidate.Id];
        for (const nestedValue of nested) {
          if (typeof nestedValue === 'string' && nestedValue.trim()) {
            return nestedValue.trim();
          }
        }
      }
    }

    return '';
  }

  private resolveUserNation(source: any): string {
    const nation = source?.nation || source?.Nation || source?.country || source?.Country;
    return typeof nation === 'string' ? nation.trim() : '';
  }

  private normalizeProfileUser(source: any): any {
    if (!source || typeof source !== 'object') {
      return {};
    }

    const pick = (...keys: string[]): any => {
      for (const key of keys) {
        const value = source[key];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
      return undefined;
    };

    const normalized = { ...source };
    normalized._id = pick('_id', 'id', 'Id', 'userId');
    normalized.id = pick('id', '_id', 'Id', 'userId');
    normalized.username = pick('username', 'Username', 'userName', 'UserName', 'email', 'Email');
    normalized.fullname = pick('fullname', 'FullName', 'name', 'Name');
    normalized.usercode = pick('usercode', 'UserCode', 'code', 'Code');
    normalized.email = pick('email', 'Email', 'mail', 'Mail');
    normalized.phone = pick('phone', 'Phone', 'phoneNumber', 'PhoneNumber');
    normalized.company = pick('company', 'Company', 'companyName', 'CompanyName');
    normalized.nation = pick('nation', 'Nation', 'country', 'Country');
    normalized.currency = pick('currency', 'Currency', 'defaultcurrency', 'defaultCurrency', 'DefaultCurrency');
    normalized.defaultcurrency = pick('defaultcurrency', 'defaultCurrency', 'DefaultCurrency', 'currency', 'Currency');
    normalized.avatar = pick('avatar', 'Avatar', 'profileImage', 'ProfileImage');
    normalized.role = Array.isArray(pick('role', 'Role', 'roles', 'Roles')) ? pick('role', 'Role', 'roles', 'Roles') : [];
    normalized.twoFAGoogle = !!pick('twoFAGoogle', 'TwoFAGoogle', 'twoFactorEnabled', 'TwoFactorEnabled');
    normalized.SecretKey = pick('SecretKey', 'secretKey', 'totpSecret', 'TotpSecret') || '';

    return normalized;
  }
}
