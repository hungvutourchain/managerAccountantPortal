import { Component, OnChanges, EventEmitter, ViewEncapsulation, Input, Output } from '@angular/core';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment as env } from 'environments/environment';
import md5 from 'md5';
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
      this.GetCurrencySelectedAsync();
      // Set default values if not exists
      this.http.get(env.urlOperationApi + '/SettingUser/GetUsersByID?id=' + this.user._id).subscribe((rs: any) => {
        this._user = rs;
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
        this.refresh.emit();
        if (!this._user?.twoFAGoogle) this.generateQrCode();
        else {
          this.loadinggenerateQrCode = false;
          this.refresh.emit();
        }
      });
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
  generateQrCode(): void {
    this.loadinggenerateQrCode = true;
    this.dbService.generateQrCode(this.user.email).subscribe((response: any) => {
      this.qrCodeBase64 = response.qrCodeBase64;
      this.secretKey = response.secretKey;
      this.loadinggenerateQrCode = false;
      this.refresh.emit();
    });
  }
  totpInvalid: boolean = false;
  validateTotp(): void {
    this.dbService.validateTotp(this.secretKey, this.totp).subscribe((response: any) => {
      if (response) {
        this.totpInvalid = false;
        this._user.twoFAGoogle = true;
        this._user.SecretKey = this.secretKey;
        this.funProfile('save', this._user);
        // TOTP is valid
      } else {
        this.totpInvalid = true;
        // TOTP is invalid
      }
    });
  }
  disable2FA() {
    this._user.twoFAGoogle = false;
    this._user.SecretKey = '';
    this.funProfile('save', this._user);
    this.generateQrCode();
  }
  CurrencySelected: any = [];
  GetCurrencySelectedAsync() {
    this.http
      .get(env.urlOperationApi + '/Config/CurrencySelectedsAsync?nation=' + this.user.nation)
      .subscribe((rs: any) => {
        this.CurrencySelected = rs;
        this.CurrencySelected.push(this.user.currency);
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
        this.http.put(env.urlOperationApi + '/SettingUser/UpdateUsersSeting', this._user).subscribe((rs: any) => {
          // this._user = rs;
          alert('Change Successfully!');
          this.refresh.emit();
        });
        break;
      case 'change_pass':
        if (this.nc_m && this.old_m) {
          this._user.pass = _.cloneDeep(this.object.confirm);
          this._user.pass = md5(this._user.pass);
          this.http.put(env.urlOperationApi + '/SettingUser/UpdateUsersSeting', this._user).subscribe((rs: any) => {
            alert('Change Password Success!');
            this.logout();
            this.refresh.emit();
          });
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
}
