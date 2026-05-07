import { Component, OnInit, ViewChild, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from 'app/core/auth/auth.service';
import { DbService } from 'app/shared/connectData/db.service';
import { UserService } from 'app/core/user/user.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as _ from 'lodash';
import { environment as env } from 'environments/environment';
import { DialogUtility } from '@syncfusion/ej2-angular-popups';

@Component({
  standalone: false,
  selector: 'auth-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class AuthSignInComponent implements OnInit, OnDestroy {
  signInForm: any = {
    username: '',
    password: '',
    nation: '',
  };
  typePassword = 'password';
  showAlert: boolean = false;
  ls_Country: any = [];
  infoWeb: any = {};
  selectedModule: any = null;
  private dialogObj: any;
  otpDigits: string = '';
  otpUser: string = ''; 
  otpEmail: string = '';
  otpUserName: string = '';
  openOTPModal: boolean = false;
  twoFAGoogle: boolean = false;
  notifyText: any = '';

  showQRLogin = false;
  isGeneratingQR = false;
  qrCodeBase64: string = '';
  secretKey: string = '';
  qrLoginPolling: any = null;
  qrSessionId: string = '';
  /**
   * Constructor
   */
  constructor(
    private _userService: UserService,
    private _authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private _router: Router,
    private http: HttpClient,
    private dbService: DbService
  ) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
  /**
   * On init
   */
  ObjectTypeParams: any;
  async refreshCountrySource() {
    this.ls_Country = await this.dbService.getCountries().toPromise();
  }
  async ngOnInit(): Promise<void> {
    // Create the form
    // this.generateQRCode();
    this.ls_Country = await this.dbService.getCountries().toPromise();
    this.activatedRoute.queryParams.subscribe(async (params: Params) => {
      try {
        this.ObjectTypeParams = params;
        this.infoWeb = await this.dbService.getAdminImage(document.location.origin).toPromise();
        let nationFirst = this.infoWeb.defaultCountry ? this.infoWeb.defaultCountry : this.ls_Country[0]?.nation;
        this.signInForm = {
          username: '',
          password: '',
          nation: nationFirst,
        };
        
        // Determine selected module from query params
        this.setSelectedModule(params.type);
      } catch (err) {
        console.log('Load data fail!', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopQRPolling();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Set selected module based on type from landing page
   */
  setSelectedModule(type: string): void {
    const moduleConfigs = {
      hotel: {
        type: 'hotel',
        name: 'ACCOMMODATION',
        shortDesc: 'Hotel Management Platform',
        image: './assets/images/login/Hotel.jpg',
        contnet: 'Hotel platform to manage the contracts from suppliers on the system for (B2B & B2C)',
      },
      tour: {
        type: 'tour',
        name: 'EXCURSION / BOOKINGS',
        shortDesc: 'Tour Management Platform',
        image: './assets/images/login/Tour.jpg',
        contnet: 'Excursion platform to maximize from contracting, product, quotation to operation.',
      }
    };

    if (type && moduleConfigs[type]) {
      this.selectedModule = moduleConfigs[type];
    } else {
      this.selectedModule = null;
    }
  }

  /**
   * Toggle password visibility
   */
  togglePassword(): void {
    this.typePassword = this.typePassword === 'password' ? 'text' : 'password';
  }

  /**
   * Sign in
   */

  CheckTheUserIsUsing() {
    if (!this.signInForm.username) {
      this.dialogObj = DialogUtility.alert({
        title: 'Authentication Required',
        content: `
          <div class="modern-alert-dialog">
            <div class="alert-icon">
              <i class="fa-solid fa-user-xmark"></i>
            </div>
            <div class="alert-content">
              <h3>Username Required</h3>
              <p>Please enter your username to continue with the authentication process.</p>
            </div>
          </div>
        `,
        position: { X: 'center', Y: 'center' },
        closeOnEscape: true,
        cssClass: 'modern-alert-dialog-container',
        width: '400px'
      });
      return;
    }
    if (!this.signInForm.password) {
      this.dialogObj = DialogUtility.alert({
        title: 'Authentication Required',
        content: `
          <div class="modern-alert-dialog">
            <div class="alert-icon">
              <i class="fa-solid fa-lock"></i>
            </div>
            <div class="alert-content">
              <h3>Password Required</h3>
              <p>Please enter your password to complete the authentication process.</p>
            </div>
          </div>
        `,
        position: { X: 'center', Y: 'center' },
        closeOnEscape: true,
        cssClass: 'modern-alert-dialog-container',
        width: '400px'
      });
      return;
    }
    if (!this.signInForm.nation) {
      this.dialogObj = DialogUtility.alert({
        title: 'Location Required',
        content: `
          <div class="modern-alert-dialog">
            <div class="alert-icon">
              <i class="fa-solid fa-globe"></i>
            </div>
            <div class="alert-content">
              <h3>Country Selection Required</h3>
              <p>Please select your country to proceed with regional authentication settings.</p>
            </div>
          </div>
        `,
        position: { X: 'center', Y: 'center' },
        closeOnEscape: true,
        cssClass: 'modern-alert-dialog-container',
        width: '400px'
      });
      return;
    }

    this._authService
      .checkTheUserIsUsing(this.signInForm.username, this.signInForm.password, this.signInForm.nation)
      .subscribe((x) => {
        if (x.twoFAGoogle) {
          this.twoFAGoogle = true;
          this.otpUser = x.userId;
          this.otpUserName = x.userName;
          this.otpEmail = x.emailVerify;
        } else {
          if (!x.twoFA) {
            this.signIn();
          } else {
            this.notifyText = `Please verify your 2FA code sent to ${x.emailVerify}! You'll receive an email`;
            // Password reset sent! You'll receive an email if you are registered on our system.
            this.openOTPModal = true;
            this.otpUser = x.userId;
            this.otpUserName = x.userName;
            this.otpEmail = x.emailVerify;
            this.SendEmailVerify();
            //  verify the otp
          }
        }
      });
  }
  user: any = {};
  PopupSwitchRoles: boolean = false;
  getClientInfo(callback: (clientInfo: string) => void) {
    const headers = new HttpHeaders().delete('Authorization');
    this.http.get('https://www.cloudflare.com/cdn-cgi/trace', { responseType: 'text', headers }).subscribe(
      (response: string) => {
        const lines = response.split('\n');
        const data = {};
        lines.forEach((line) => {
          const [key, value] = line.split('=');
          if (key && value) {
            data[key.trim()] = value.trim();
          }
        });

        const ip = data['ip'] || 'Unknown';
        const userAgent = navigator.userAgent;
        const screenResolution = `${window.screen.width}x${window.screen.height}`;
        const clientInfo = `IP: ${ip}, UserAgent: ${userAgent}, Screen: ${screenResolution}`;
        callback(clientInfo);
      },
      (error) => {
        console.error('Error fetching client info:', error);
        const fallbackInfo = `UserAgent: ${navigator.userAgent}, Screen: ${window.screen.width}x${window.screen.height}`;
        callback(fallbackInfo);
      }
    );
  }
  signIn(): void {
    localStorage.removeItem('AuthToken');
    localStorage.removeItem('codeForOneUser');

    this.getClientInfo((ip) => {
      this.SubmitLogin(ip);
    });
  }
  SubmitLogin(ip) {
    this._authService.signIn(this.signInForm, false, ip).subscribe(
      (rs) => {
        // const redirectURL = this.activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
        // this._router.navigateByUrl(redirectURL);
        if (rs && rs.token) {
          this._userService.get().subscribe(
            async (user: any) => {
              if (user && user?._id) {
                this.user = user;
                if (this.user.isviewAdmin) {
                  if (this.ObjectTypeParams && this.ObjectTypeParams.type == 'tour') {
                    let lsRoles = this.user.role.filter((x) => x.code !== 'Leader');
                    if (lsRoles.length > 1) {
                      this.PopupSwitchRoles = true;
                    } else {
                      if (this.user.IsOperation || this.user.IsAccounting) {
                        location.href = '/ope/tours?country=' + this.user.nation + '&user=' + this.user.username;
                      } else if (this.user.IsReport) {
                        location.href =
                          'tours/report-booking?country=' + this.user.nation + '&user=' + this.user.username;
                      } else
                        this._router.navigate(['tours'], {
                          queryParams: {
                            country: this.user.nation,
                            user: this.user.username,
                          },
                        });
                    }
                  } else {
                    let temp = this.user.role.find((x) => x.code == 'Product');
                    if (this.user.IsAdmin || this.user.IsProduct || (temp && temp.code == 'Product')) {
                      this._router.navigate(['hotel'], {
                        queryParams: {
                          country: this.user.nation,
                          user: this.user.username,
                        },
                      });
                    } else {
                      this.dialogObj = DialogUtility.alert({
                        title: 'Access Restricted',
                        content: `
                          <div class="modern-alert-dialog">
                            <div class="alert-icon error">
                              <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <div class="alert-content">
                              <h3>Insufficient Permissions</h3>
                              <p>You don't have the required permissions to access the Product Teams platform.</p>
                              <div class="alert-footer">
                                <small>Contact your administrator if you believe this is an error.</small>
                              </div>
                            </div>
                          </div>
                        `,
                        position: { X: 'center', Y: 'center' },
                        closeOnEscape: true,
                        cssClass: 'modern-alert-dialog-container',
                        width: '450px'
                      });
                    }
                  }
                } else if (_.head<any>(_.get(this.user, 'role')).code === 'Report') {
                  this._router.navigate(['tours/report-booking'], {
                    queryParams: {
                      country: this.user.nation,
                      user: this.user.username,
                    },
                  });
                } else {
                  this._router.navigate(['']);
                }
              }
            },
            (error) => {
              this._router.navigate(['maintenace']);
            }
          );
        } else {
          if (rs?.deviceLimit) {
            this.dialogObj = DialogUtility.confirm({
              title: 'Device Limit Reached',
              content: `
                <div class="modern-dialog-content">
                  <div class="dialog-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div class="dialog-header">
                    <h3>Maximum Device Limit Exceeded</h3>
                  </div>
                  <div class="dialog-message">
                    <p>You have reached the maximum of <span class="device-count">${rs?.mes || 'allowed'}</span> active devices for your account.</p>
                  </div>
                  <div class="dialog-options">
                    <h4>To continue, you can either:</h4>
                    <div class="options-list">
                      <div class="option-item">
                        <i class="fa-solid fa-power-off"></i>
                        <span>Sign out from all other devices and continue here</span>
                      </div>
                      <div class="option-item">
                        <i class="fa-solid fa-xmark"></i>
                        <span>Cancel and manually sign out from another device</span>
                      </div>
                    </div>
                  </div>
                  <div class="dialog-footer">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span>This helps keep your account secure by limiting concurrent sessions.</span>
                  </div>
                </div>
              `,
              okButton: {
                text: 'Sign Out All & Continue',
                click: () => {
                  this.logoutAllDevicesAndLogin(rs?.idUser);
                  this.CheckTheUserIsUsing();
                  this.dialogObj.hide();
                },
              },
              cancelButton: {
                text: 'Cancel',
                click: () => {
                  this.dialogObj.hide();
                },
              },
              position: { X: 'center', Y: 'center' },
              closeOnEscape: true,
              width: '500px',
              cssClass: 'modern-device-limit-dialog',
            });
            return;
          } else {
            this.dialogObj = DialogUtility.alert({
              title: 'Authentication Failed',
              content: `
                <div class="modern-alert-dialog">
                  <div class="alert-icon error">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div class="alert-content">
                    <h3>Login Unsuccessful</h3>
                    <p>${rs?.mes || 'Authentication failed. Please check your credentials and try again.'}</p>
                    <div class="alert-footer">
                      <small>Ensure your username, password, and country are correct.</small>
                    </div>
                  </div>
                </div>
              `,
              position: { X: 'center', Y: 'center' },
              closeOnEscape: true,
              cssClass: 'modern-alert-dialog-container',
              width: '450px'
            });
          }
        }
      },
      (response) => {
        this.showAlert = true;
      }
    );
  }
  logoutAllDevicesAndLogin(idUser) {
    if (idUser) {
      this.http.get(env.urlOperationApi + `/ManagerUser/authenticateBackend_logout_all?idUser=${idUser}`).subscribe(
        (rs: any) => {},
        (error) => {
          // Handle error case
          console.error('Error logging out all devices:', error);
          this.dialogObj = DialogUtility.alert({
            title: 'Operation Failed',
            content: `
              <div class="modern-alert-dialog">
                <div class="alert-icon error">
                  <i class="fa-solid fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                  <h3>Device Logout Failed</h3>
                  <p>Unable to sign out from other devices at this time. Please try again in a few moments.</p>
                  <div class="alert-footer">
                    <small>If the issue persists, please contact technical support.</small>
                  </div>
                </div>
              </div>
            `,
            position: { X: 'center', Y: 'center' },
            closeOnEscape: true,
            cssClass: 'modern-alert-dialog-container',
            width: '450px'
          });
        }
      );
    }
  }
  ActionRole(action) {
    if (action) {
      let role = this.user.role.find((x) => x.active);
      if (role) {
        this.http.get(env.urlOperationApi + '/SettingUser/GetUsersByID?id=' + this.user._id).subscribe((rs: any) => {
          rs.role = this.user.role;
          this.http.put(env.urlOperationApi + '/SettingUser/UpdateUsersSeting', rs).subscribe((rs: any) => {
            if (this.user.IsView)
              this._router.navigate(['tours/view'], {
                queryParams: {
                  country: this.user.nation,
                  user: this.user.username,
                },
              });
            else if (this.user.IsOperation || this.user.IsAccounting) {
              location.href = '/ope/tours?country=' + this.user.nation + '&user=' + this.user.username;
            } else if (this.user.IsReport) {
              location.href = 'tours/report-booking?country=' + this.user.nation + '&user=' + this.user.username;
            } else
              this._router.navigate(['tours'], {
                queryParams: {
                  country: this.user.nation,
                  user: this.user.username,
                },
              });
          });
        });
      } else {
        this.dialogObj = DialogUtility.alert({
          title: 'Role Selection Required',
          content: `
            <div class="modern-alert-dialog">
              <div class="alert-icon warning">
                <i class="fa-solid fa-user-gear"></i>
              </div>
              <div class="alert-content">
                <h3>Please Select a Role</h3>
                <p>You must select exactly one role to continue accessing the system.</p>
                <div class="alert-footer">
                  <small>Choose the appropriate role for your current session.</small>
                </div>
              </div>
            </div>
          `,
          position: { X: 'center', Y: 'center' },
          closeOnEscape: true,
          cssClass: 'modern-alert-dialog-container',
          width: '400px'
        });
      }
    }
  }
  ChangeRoles(vl, event: boolean = false) {
    vl.active = event;
    this.user.role
      .filter((x) => x._id != vl._id)
      .forEach((vl) => {
        vl.active = false;
      });
    this._userService.Checkrole(this.user.role, this.user.role);
  }
  disableduserVerify: boolean = true;
  onOtpChange(event) {
    // Handle both string (from ejs-otpinput) and event object (from ng-otp-input)
    const value = typeof event === 'string' ? event : event;
    this.otpDigits = value;
    if (value && value.length == 4) {
      this.disableduserVerify = false;
    } else {
      this.disableduserVerify = true;
    }
  }
  alertTextVerify: string = '';
  userVerify() {
    this.alertTextVerify = '';
    this._authService.userVerify(this.otpUser, this.otpDigits, false).subscribe((x) => {
      if (x) {
        this.openOTPModal = false;
        this.signIn();
      } else this.alertTextVerify = 'Invalid OTP';
    });
  }
  public placeHolder: string = 'X';
  public separatorVal: string = '-';
  public otpCssClass: string = '';
  public lengthVal: number = 6;
  public disabledVal: boolean = false;
  public styleMode: string = 'Underlined';
  numberGoogleVerify: any = '';
  userVerifyGoogle() {
    this.alertTextVerify = '';
    this._authService.userVerify(this.otpUser, this.otpDigits, true, this.numberGoogleVerify).subscribe((x) => {
      if (x) {
        this.twoFAGoogle = false;
        this.signIn();
      } else this.alertTextVerify = 'Invalid OTP';
    });
  }
  async SendEmailVerify() {
    // let image = this.infoWeb.imageLogo
    let data = `
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
          <!--[if gte mso 9]>
          <xml>
            <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
          <![endif]-->
          <meta http-equiv="Content-type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="format-detection" content="date=no">
          <meta name="format-detection" content="address=no">
          <meta name="format-detection" content="telephone=no">
          <meta name="x-apple-disable-message-reformatting">
          <!--[if !mso]><!-->
          <link href="https://fonts.googleapis.com/css?family=Merriweather:400,400i,700,700i" rel="stylesheet">
          <!--<![endif]-->
          <title>Email Template</title>
          <!--[if gte mso 9]>
          <style type="text/css" media="all">
            sup { font-size: 100% !important; }
          </style>
          <![endif]-->


          <style type="text/css" media="screen">
            /* Linked Styles */
            body {
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
              min-width: 100% !important;
              width: 100% !important;
              background: #001f51;
              -webkit-text-size-adjust: none
            }

            a {
              color: #000001;
              text-decoration: none
            }

            p {
              padding: 0 !important;
              margin: 0 !important
            }

            img {
              -ms-interpolation-mode: bicubic;
              /* Allow smoother rendering of resized image in Internet Explorer */
            }

            .mcnPreviewText {
              display: none !important;
            }


            /* Mobile styles */
            @media only screen and (max-device-width: 480px),
            only screen and (max-width: 480px) {
              .mobile-shell {
                width: 100% !important;
                min-width: 100% !important;
              }

              .bg {
                background-size: 100% auto !important;
                -webkit-background-size: 100% auto !important;
              }

              .text-header,
              .m-center {
                text-align: center !important;
              }

              .center {
                margin: 0 auto !important;
              }

              .container {
                padding: 20px 10px !important
              }

              .td {
                width: 100% !important;
                min-width: 100% !important;
              }

              .m-br-15 {
                height: 15px !important;
              }

              .p30-15 {
                padding: 30px 15px !important;
              }

              .p0-15-30 {
                padding: 0px 15px 30px 15px !important;
              }

              .mpb30 {
                padding-bottom: 30px !important;
              }

              .m-td,
              .m-hide {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
                font-size: 0 !important;
                line-height: 0 !important;
                min-height: 0 !important;
              }

              .m-block {
                display: block !important;
              }

              .fluid-img img {
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
              }

              .column,
              .column-dir,
              .column-top,
              .column-empty,
              .column-empty2,
              .column-dir-top {
                float: left !important;
                width: 100% !important;
                display: block !important;
              }

              .column-empty {
                padding-bottom: 30px !important;
              }

              .column-empty2 {
                padding-bottom: 10px !important;
              }

              .content-spacing {
                width: 15px !important;
              }
            }
          </style>
        </head>

        <body class="body" style="padding:0 !important; margin:0 !important; display:block !important; min-width:100% !important; width:100% !important; background:#001f51; -webkit-text-size-adjust:none;" data-new-gr-c-s-check-loaded="14.1098.0" data-gr-ext-installed="">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#001f51">
            <tbody>
              <tr>
                <td align="center" valign="top">
                  <table width="650" border="0" cellspacing="0" cellpadding="0" class="mobile-shell">
                    <tbody>
                      <tr>
                        <td class="td container" style="width:650px; min-width:650px; font-size:0pt; line-height:0pt; margin:0; font-weight:normal; padding:55px 0px;">

                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tbody>
                              <tr>
                                <td class="p30-15 tbrr" style="padding: 30px; border-radius:12px 12px 0px 0px;" bgcolor="#ffffff">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tbody>
                                      <tr>
                                        <th class="column-top" width="145" style="font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal; vertical-align:top;">
                                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tbody>
                                              <tr>
                                                <td class="img m-center" style="font-size:0pt; line-height:0pt; text-align:left;"><img src="${this.infoWeb.imageLogo}" width="166" border="0" alt=""></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </th>
                                        <th class="column-empty2" width="1" style="font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal; vertical-align:top;">
                                        </th>
                                        <th class="column" style="font-size:0pt; line-height:0pt; padding:0; margin:0; font-weight:normal;">
                                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tbody>
                                              <tr>
                                                <td class="text-header" style="color:#666666; font-family:'Merriweather', Georgia,serif; font-size:12px; line-height:18px; text-align:right;">
                                                  <strong>🔐 SECURITY VERIFICATION</strong><br>
                                                  <a href="${this.infoWeb.linkAdmin}" target="_blank" class="link2" style="color:#0066cc; text-decoration:none;"><span class="link2" style="color:#0066cc; text-decoration:none;">Visit Our Website</span></a>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </th>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
                            <tbody>
                              <tr>
                                <td style="padding-bottom: 10px;">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tbody>
                                      <tr>
                                        <td class="p30-15" style="padding: 49px 30px;">
                                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tbody>
                                              <tr>
                                                <td class="h1 pb25" style="color:#2c5aa0; font-family:'Merriweather', Georgia,serif; font-size:28px; line-height:36px; text-align:center; padding-bottom:25px;">
                                                  🔑 Login Verification Code</td>
                                              </tr>
                                              <tr>
                                                <td class="h2 pb15" style="color:#444444; font-family:'Merriweather', Georgia,serif; font-size:18px; line-height:24px; text-align:center; padding-bottom:15px; border-bottom: 2px solid #f0f0f0; margin-bottom: 20px;">
                                                  ${this.infoWeb.nameCompany}</td>
                                              </tr>
                                              <tr>
                                                <td class="text-center pb25" style="color:#666666;font-family:Arial,sans-serif;font-size:16px;line-height:30px;text-align: left;padding-bottom:25px;">
                                                  Dear <strong>${this.otpUserName}</strong>,<br><br>
                                                  We detected a sign-in attempt to your Tour Chain account. To ensure your account security, please use the verification code below to complete your login process.
                                                  <br><br>
                                                  <strong style="color:#2c5aa0;">This is an official security verification from Tour Chain.</strong>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                  <table style="background-color: #f8f9fa; border: 2px solid #2c5aa0; border-radius: 12px; padding: 25px;">
                                                    <tr>
                                                      <td style="text-align: center;">
                                                        <div style="color:#2c5aa0; font-family:Arial,sans-serif; font-size:16px; line-height:20px; margin-bottom: 10px;">
                                                          <strong>🔢 Your Verification Code:</strong>
                                                        </div>
                                                        <div style="background: linear-gradient(45deg, #a4a6a9ff, #4e5054ff); color: #1e3a8a; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; padding: 15px 25px; border-radius: 8px; letter-spacing: 8px; display: inline-block; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                                                          {{NumberVerify}}
                                                        </div>
                                                        <div style="color:#666; font-family:Arial,sans-serif; font-size:12px; line-height:16px; margin-top: 10px;">
                                                          <em>⏰ This code expires in 10 minutes</em>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>                                          
                                              <tr>
                                                <td style="padding: 20px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; margin: 20px 0;">
                                                  <table width="100%">
                                                    <tr>
                                                      <td style="color:#856404; font-family:Arial,sans-serif; font-size:16px; line-height:24px;">
                                                        <strong>⚠️ Security Instructions:</strong>
                                                        <ul style="margin: 10px 0; padding-left: 20px;">
                                                          <li><strong>Do not share this code</strong> with anyone, including Tour Chain staff</li>
                                                          <li><strong>Use this code only</strong> in the official Tour Chain login page</li>
                                                          <li><strong>Code is valid for 10 minutes</strong> from the time it was sent</li>
                                                          <li><strong>If you didn't request this</strong> - your account may be compromised</li>
                                                          <li><strong>Contact support immediately</strong> if you suspect unauthorized access</li>
                                                        </ul>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td style="padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; margin: 20px 0;">
                                                  <table width="100%">
                                                    <tr>
                                                      <td style="color:#155724; font-family:Arial,sans-serif; font-size:14px; line-height:20px;">
                                                        <strong>🛡️ Authentication Details:</strong><br>
                                                        • Login attempt detected at: ${new Date().toLocaleString()}<br>
                                                        • This verification was requested for account: <strong>${this.otpUserName}</strong><br>
                                                        • Email sent to: <strong>${this.otpEmail}</strong><br>
                                                        • This is an automated security message from Tour Chain
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td class="text-center pb25" style="color:#666666;font-family:Arial,sans-serif;font-size:16px;line-height:24px;text-align: left;padding-bottom:25px;">
                                                  If you have any questions or concerns, please don't hesitate to contact our security team.
                                                  <br><br>
                                                  Best regards,<br>
                                                  <strong>Tour Chain Security Team</strong><br>
                                                  <em>Official Authentication Services</em>
                                                  <br><br>
                                                  📞 <strong>Need Help?</strong> Contact us:<br>
                                                  • Security Email: <a href="mailto:security@tourchain.net" style="color:#2c5aa0;">security@tourchain.net</a><br>
                                                  • Support: <a href="mailto:support@tourchain.net" style="color:#2c5aa0;">support@tourchain.net</a><br>
                                                  • Website: <a href="https://tourchain.net" style="color:#2c5aa0;">tourchain.net</a>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tbody>
                              <tr>
                                <td class="p30-15 bbrr" style="padding: 50px 30px; border-radius:0px 0px 12px 12px;" bgcolor="#ffffff">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tbody>
                                      <tr>
                                        <td class="text-footer1 pb10" style="color:#999999;font-family:Arial,sans-serif;font-size: 13px;line-height:20px;text-align:center;padding-bottom:10px;">
                                          <img src="https://trial.tourchain.net/manager/assets/images/logo/TourChain.svg" style="width: 160px; margin: auto;" border="0" alt="Tour Chain Logo">
                                          <br><br>
                                          <strong style="color:#2c5aa0;">OFFICIAL TOUR CHAIN SECURITY VERIFICATION</strong>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 15px 0; border-top: 1px solid #eee;">
                                          <table width="100%">
                                            <tr>
                                              <td style="color:#666; font-family:Arial,sans-serif; font-size: 12px; line-height:18px; text-align:center;">
                                                <strong>Security & Support:</strong><br>
                                                🔒 Security Team: <a href="mailto:security@tourchain.net" style="color:#2c5aa0;">security@tourchain.net</a><br>
                                                📧 General Support: <a href="mailto:info@tourchain.net" style="color:#2c5aa0;">info@tourchain.net</a><br>
                                                🌐 Website: <a href="https://tourchain.net" style="color:#2c5aa0;">tourchain.net</a><br>
                                                📍 Tour Chain Travel Business Solutions<br>
                                                🕒 Support Hours: Mon-Fri 9AM-6PM (GMT+7)
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td class="text-footer2" style="color:#999999;font-family:Arial,sans-serif;font-size: 11px;line-height:16px;text-align:center; padding-top: 15px; border-top: 1px solid #eee;">
                                          <strong>© 2025 Tour Chain Travel Business Solutions</strong><br>
                                          This verification email was sent from a secure, monitored system.<br>
                                          <strong style="color:#d73527;">⚠️ SECURITY ALERT:</strong> Never share verification codes with others.<br>
                                          If you didn't request this code, please contact our security team immediately.
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    await this.dbService
      .SendEmailVerify({
        content: data,
        userId: this.otpUser,
        email: this.otpEmail,
      })
      .toPromise();
  }

  // Generate QR code for login
  generateQRCode(): void {
    this.isGeneratingQR = true;
    // Generate unique session ID for this QR login attempt
    this.qrSessionId = this.generateSessionId();
    const qrEmail = `qr-login-${this.qrSessionId}@tourchain.com`;

    this.dbService.generateQrCode(qrEmail).subscribe({
      next: (response: any) => {
        this.qrCodeBase64 = response.qrCodeBase64;
        this.secretKey = response.secretKey;
        this.isGeneratingQR = false;
        this.startQRPolling();
      },
      error: (error) => {
        console.error('Error generating QR code:', error);
        this.isGeneratingQR = false;
        this.showAlert = true;
      },
    });
  }

  generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Start polling for QR code scan status
  startQRPolling(): void {
    this.qrLoginPolling = setInterval(() => {
      this.checkQRLoginStatus();
    }, 3000); // Check every 3 seconds
  }

  // Stop QR polling
  stopQRPolling(): void {
    if (this.qrLoginPolling) {
      clearInterval(this.qrLoginPolling);
      this.qrLoginPolling = null;
    }
  }

  checkQRLoginStatus(): void {
    if (!this.qrSessionId) return;

    this.dbService.checkQRLoginStatus(this.qrSessionId).subscribe({
      next: (response: any) => {
        if (response.success && response.user) {
          this.stopQRPolling();
          this.handleQRLoginSuccess(response.user);
        }
      },
      error: (error) => {
        console.error('Error checking QR login status:', error);
      },
    });
  }

  // Handle successful QR login
  handleQRLoginSuccess(userData: any): void {
    this.user = userData;
    this.showQRLogin = false;

    // Continue with existing login flow
    this.CheckTheUserIsUsing();
  }

  // Toggle between form login and QR login
  toggleQRLogin(): void {
    this.showQRLogin = !this.showQRLogin;
    if (this.showQRLogin) {
      this.generateQRCode();
    } else {
      this.stopQRPolling();
    }
  }

  // Refresh QR code
  refreshQRCode(): void {
    this.stopQRPolling();
    this.generateQRCode();
  }
}
