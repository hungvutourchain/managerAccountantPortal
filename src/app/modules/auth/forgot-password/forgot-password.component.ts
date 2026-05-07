import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { DbService } from 'app/shared/connectData/db.service';
import { Base64 } from 'js-base64';
import * as $ from 'jquery';
import { environment as env } from 'environments/environment';
@Component({  standalone: false,
  selector: 'auth-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class AuthForgotPasswordComponent implements OnInit {
  @ViewChild('forgotPasswordNgForm' , { static: true }) forgotPasswordNgForm: NgForm;

  alert: { type: FuseAlertType; message: string } = {
    type: 'success',
    message: ''
  };
  forgotPasswordForm: any;
  showAlert: boolean = false;
  ls_Country: any = []
  infoWeb: any = {}
  ObjectTypeParams: any;
  selectedModule: any = null;
  /**
   * Constructor
   */
  constructor(
    private dbService: DbService,
    private _router: Router,
    private _formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  async ngOnInit(): Promise<void> {
    // Create the form
    this.forgotPasswordForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      nation: ['', [Validators.required]]
    });
    
    // Handle query parameters
    this.activatedRoute.queryParams.subscribe(async (params: Params) => {
      try {
        this.ObjectTypeParams = params;
        
        let [ls_Country, infoWeb] = await Promise.all([
          this.dbService.getCountries().toPromise(),
          this.dbService.getAdminImage(document.location.origin).toPromise(),
        ])
        this.infoWeb = infoWeb
        this.ls_Country = ls_Country
        
        // Set selected module based on type parameter
        this.setSelectedModule(params.type);
      }
      catch (err) {
        console.log("Load data fail!", err)
      }
    });
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
   * Send the reset link
   */
  sendResetLink(): void {
    // Return if the form is invalid
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    // Disable the form
    this.forgotPasswordForm.disable();

    // Hide the alert
    this.showAlert = false;

    // Forgot password
    this.dbService.CheckEmailUser(this.forgotPasswordForm.get('email').value,
      this.forgotPasswordForm.get('nation').value).subscribe(
        (rs) => {
          if (rs) {
            let object = $.parseJSON(Base64.decode(rs))
            if (object.success) {
              this.SendEmail(object)
              this.alert = {
                type: 'success',
                message: 'Password reset sent! You\'ll receive an email if you are registered on our system.'
              };
              alert(this.alert.message)
              // this.infoWeb.imageLogo
              location.href = this.infoWeb?.linkAdmin?? '/';
            } else alert("Sorry, Email does not exist.")
          }
        },(response) => {
          // Set the alert
          this.alert = {
            type: 'error',
            message: 'Email does not found! Are you sure you are already a member?'
          };
          alert(this.alert.message)
          this.showAlert = true;
        }
      );
  }
  email: string;
  SendEmail(rs) {
    let Country = this.ls_Country.find(n => n.nation === rs.nation);
    let Email = this.forgotPasswordForm.get('email').value
    // let image = this.infoWeb.imageLogo
    var textEmail = `
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
                                                  <strong>OFFICIAL NOTIFICATION</strong><br>
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
                                                  🔐 Password Reset Request</td>
                                              </tr>
                                              <tr>
                                                <td class="h2 pb15" style="color:#444444; font-family:'Merriweather', Georgia,serif; font-size:18px; line-height:24px; text-align:center; padding-bottom:15px; border-bottom: 2px solid #f0f0f0; margin-bottom: 20px;">
                                                  ${this.infoWeb.nameCompany}</td>
                                              </tr>



                                              <tr>
                                                <td class="text-center pb25" style="color:#666666;font-family:Arial,sans-serif;font-size:16px;line-height:30px;text-align: left;padding-bottom:25px;">
                                                  Dear <strong>${rs.user}</strong>,<br><br>
                                                  We have received a request to reset your password for your Tour Chain account. For your security, we have generated a temporary password to help you regain access to your account.
                                                  <br><br>
                                                  <strong style="color:#2c5aa0;">This is an official communication from Tour Chain.</strong>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td style="padding: 20px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; margin: 20px 0;">
                                                  <table width="100%" style="font-family:Arial,sans-serif;font-size:16px;line-height:24px;">
                                                    <tr>
                                                      <td style="color:#333; padding-bottom: 10px;"><strong>Your Login Credentials:</strong></td>
                                                    </tr>
                                                    <tr>
                                                      <td style="color:#666; padding: 5px 0;"><strong>Username:</strong> ${rs.user}</td>
                                                    </tr>
                                                    <tr>
                                                      <td style="color:#666; padding: 5px 0;"><strong>Temporary Password:</strong> ${rs.pass}</td>
                                                    </tr>
                                                    <tr>
                                                      <td style="color:#666; padding: 5px 0;"><strong>Country:</strong> ${Country.name}</td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                  <table>
                                                    <tr>
                                                      <td style="background-color: #2c5aa0; padding: 15px 30px; border-radius: 6px;">
                                                        <a href="${this.infoWeb.linkAdmin}" target="_blank" style="color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">
                                                          🔗 Access Your Account
                                                        </a>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td class="text-center pb25" style="color:#666666;font-family:Arial,sans-serif;font-size:14px;line-height:20px;text-align: center;padding-bottom:25px;">
                                                  Or copy and paste this link: <br>
                                                  <a href="${this.infoWeb.linkAdmin}" target="_blank" style="color:#2c5aa0; text-decoration:none; word-break: break-all;">${this.infoWeb.linkAdmin}</a>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td style="padding: 20px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; margin: 20px 0;">
                                                  <table width="100%">
                                                    <tr>
                                                      <td style="color:#856404; font-family:Arial,sans-serif; font-size:16px; line-height:24px;">
                                                        <strong>⚠️ Important Security Notice:</strong>
                                                        <ul style="margin: 10px 0; padding-left: 20px;">
                                                          <li><strong>Change your password immediately</strong> after logging in through your Profile settings</li>
                                                          <li><strong>Keep this information confidential</strong> - never share your login credentials</li>
                                                          <li><strong>Verify the sender</strong> - This email is sent from Tour Chain's official system</li>
                                                          <li><strong>Report suspicious activity</strong> - If you didn't request this reset, contact us immediately</li>
                                                          <li><strong>This link expires</strong> in 24 hours for security reasons</li>
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
                                                        <strong>🛡️ Anti-Fraud Verification:</strong><br>
                                                        • This email was sent from Tour Chain's secure server<br>
                                                        • Request initiated from IP: [System Generated]<br>
                                                        • Request time: ${new Date().toLocaleString()}<br>
                                                        • This is an automated message - please do not reply
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td class="text-center pb25" style="color:#666666;font-family:Arial,sans-serif;font-size:16px;line-height:24px;text-align: left;padding-bottom:25px;">
                                                  Best regards,<br>
                                                  <strong>Tour Chain Security Team</strong><br>
                                                  <em>Official Customer Support</em>
                                                  <br><br>
                                                  📞 <strong>Need Help?</strong> Contact our support team:<br>
                                                  • Email: <a href="mailto:support@tourchain.net" style="color:#2c5aa0;">support@tourchain.net</a><br>
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
                                          <strong style="color:#2c5aa0;">OFFICIAL TOUR CHAIN COMMUNICATION</strong>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="padding: 15px 0; border-top: 1px solid #eee;">
                                          <table width="100%">
                                            <tr>
                                              <td style="color:#666; font-family:Arial,sans-serif; font-size: 12px; line-height:18px; text-align:center;">
                                                <strong>Contact Information:</strong><br>
                                                📧 Email: info@tourchain.net | support@tourchain.net<br>
                                                🌐 Website: <a href="https://tourchain.net" style="color:#2c5aa0;">tourchain.net</a><br>
                                                📍 Address: Tour Chain Travel Business Solutions<br>
                                                🕒 Business Hours: Mon-Fri 9AM-6PM (GMT+7)
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td class="text-footer2" style="color:#999999;font-family:Arial,sans-serif;font-size: 11px;line-height:16px;text-align:center; padding-top: 15px; border-top: 1px solid #eee;">
                                          <strong>© 2025 Tour Chain Travel Business Solutions</strong><br>
                                          This email was sent from a secure, monitored system. Please do not reply to this automated message.<br>
                                          If you believe this email was sent in error, please contact our support team immediately.
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
      `
    var Emails = [{
      Email: Email,
      Subject: '[Tour Chain Official] Password Reset - Action Required',
      Content: textEmail
    }]
    this.dbService.notifyApiUrl(Emails).subscribe(rs => {
      if (rs) {
        this.alert = {
          type: 'success',
          message: 'New temporary passcode has been sent to your email submit. Please check it either in your  inbox or junk email.'
        };
      }
    })
  }
}
