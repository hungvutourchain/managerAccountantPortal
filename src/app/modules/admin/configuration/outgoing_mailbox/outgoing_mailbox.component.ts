import { Component, OnInit } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppFactory } from 'app/shared/lib/common.service';
import * as _ from 'lodash';
import { MessagingService } from 'app/shared/messaging.service';
import { HttpClient } from '@angular/common/http';
import { environment as env } from 'environments/environment';
@Component({
  standalone: false,
  selector: 'app-outgoing-mailbox',
  templateUrl: './outgoing_mailbox.component.html',
  styleUrls: ['./outgoing_mailbox.component.css'],
})
export class OutgoingMailboxComponent implements OnInit {
  user: any;
  titelPage: any = 'Outgoing Mailbox';
  constructor(
    private _userService: UserService,
    public afac: AppFactory,
    private http: HttpClient,
    private _snackBar: MatSnackBar,
    private messagingService: MessagingService
  ) {
    this.afac.setTitle(this.titelPage);
  }

  ngOnInit() {
    this._userService.user$.subscribe(async (user: any) => {
      if (user && user?._id) {
        this.user = user;
        // Initialize brevoConfig if it doesn't exist
        if (!this.emailSetting.brevoConfig) {
          this.emailSetting.brevoConfig = {
            smtpServer: 'smtp-relay.brevo.com',
            port: 587,
            username: '',
            password: '',
            fromEmail: '',
            fromName: '',
            useSSL: true,
          };
        }
        this.InitServiceType(this.user.nation);
        this.loadEmailConfig();
      }
    });
  }

  // -----------------------------------------------------
  // notifi
  notifi(type, mes, time = 2000): void {
    this._snackBar.open(mes, type, {
      duration: time,
      panelClass: [type === 'error' ? 'red-snackbar' : 'blue-snackbar'],
    });
  }
  // -----------------------------------------------------

  emailSetting: any = {};

  saveEmailConfig(emailSetting) {
    this.messagingService.setEmailConfig(emailSetting).subscribe((rs) => {
      if (rs) this.notifi('success', 'Save outgoing mailbox setting successfully!', 5000);
      else this.notifi('error', 'Save outgoing mailbox setting fail!', 5000);
    });
  }

  loadEmailConfig() {
    this.messagingService.getEmailConfig().subscribe((data) => {
      this.emailSetting = data || {};
      // Ensure brevoConfig is initialized after loading
      if (!this.emailSetting.brevoConfig) {
        this.emailSetting.brevoConfig = {
          smtpServer: 'smtp-relay.brevo.com',
          port: 587,
          username: '',
          password: '',
          fromEmail: '',
          fromName: '',
          useSSL: true,
        };
      }
    });
  }

  sendEmailTest() {
    var emailMsg = this.messagingService.createSendTestEmail(this.user.email);
    this.messagingService
      .sendEmails([emailMsg])
      .then((rs) => {
        this.notifi('success', 'Send test email successfully!');
      })
      .catch((err) => {
        this.notifi('error', 'Send test email fail!');
      });
  }
  ListEmailTypes: any = ['Operation', 'Reservation', 'Accounting', 'CRM', 'Client'];
  popupSettingEmail: boolean = false;
  EmailType: any = { email: {} };
  lsEmails: any = [];
  cSave: any = false;
  searchText: any = '';
  InitServiceType(nation) {
    this.http.post(env.notifyApiUrl + '/config/ListEmailSetting', { nation: nation }).subscribe((rs: any) => {
      this.lsEmails = rs || [];
    });
  }
  onMailChimpChange(isChecked: boolean) {
    if (isChecked) {
      // If MailChimp is selected, uncheck other options
      this.emailSetting.relyByEmailSystem = false;
      this.emailSetting.isBrevoSmtp = false;
    }
  }

  onBrevoSmtpChange(isChecked: boolean) {
    if (isChecked) {
      // If Brevo SMTP is selected, uncheck other options
      this.emailSetting.isMailChimp = false;
      this.emailSetting.relyByEmailSystem = false;

      // Initialize brevoConfig with default values if not exists
      if (!this.emailSetting.brevoConfig) {
        this.emailSetting.brevoConfig = {
          smtpServer: 'smtp-relay.brevo.com',
          port: 587,
          username: '',
          password: '',
          fromEmail: '',
          fromName: '',
          useSSL: true,
        };
      }
    }
  }

  onEmailSystemChange(isChecked: boolean) {
    if (isChecked) {
      // If Email System is selected, uncheck other options
      this.emailSetting.isMailChimp = false;
      this.emailSetting.isBrevoSmtp = false;
    }
  }
  EmailTypeValue(action, Value: any = null): any {
    if (action === 'delete') {
      if (confirm('Are you sure to delete?')) {
        this.http.post(env.notifyApiUrl + '/config/RemoveEmailSetting', Value).subscribe((rs: any) => {
          this.lsEmails.splice(this.lsEmails.indexOf(Value), 1);
        });
      }
    } else if (action === 'add') {
      if (!Value.emailType) {
        this.notifi('warning', 'Outgoing Mailbox Type is required!');
        return null;
      }

      // Brevo validation
      if (Value.email?.isBrevoSmtp) {
        if (!Value.email?.brevoConfig?.smtpServer) {
          this.notifi('warning', 'Brevo SMTP Server is required!');
          return null;
        }
        if (!Value.email?.brevoConfig?.port) {
          this.notifi('warning', 'Brevo SMTP Port is required!');
          return null;
        }
        if (!Value.email?.brevoConfig?.username) {
          this.notifi('warning', 'Brevo Username is required!');
          return null;
        }
        if (!Value.email?.tokenMailChimp) {
          this.notifi('warning', 'Brevo SMTP Key is required!');
          return null;
        }
        if (!Value.email?.brevoConfig?.fromEmail) {
          this.notifi('warning', 'Brevo From Email is required!');
          return null;
        }
        if (!Value.email?.brevoConfig?.fromName) {
          this.notifi('warning', 'Brevo From Name is required!');
          return null;
        }
      }
      // MailChimp validation
      else if (Value.email?.isMailChimp) {
        if (!Value.email?.tokenMailChimp) {
          this.notifi('warning', 'MailChimp Token is required!');
          return null;
        }
      }
      // Standard SMTP validation
      else {
        if (!Value.email?.mailServer) {
          this.notifi('warning', 'Mail server is required!');
          return null;
        }
        if (!Value.email?.mailPort) {
          this.notifi('warning', 'Mail port is required!');
          return null;
        }
        if (!Value.email?.senderName) {
          this.notifi('warning', 'Sender Name is required!');
          return null;
        }
        if (!Value.email?.sender) {
          this.notifi('warning', 'Outgoing Email Account is required!');
          return null;
        }
        if (!Value.email?.password) {
          this.notifi('warning', 'Password is required!');
          return null;
        }
      }
      let temp: any = _.cloneDeep(Value);
      temp.nation = this.user.nation;
      this.http.post(env.notifyApiUrl + '/config/AddEmailSetting', temp).subscribe((rs: any) => {
        if (rs) {
          this.popupSettingEmail = false;
          this.InitServiceType(this.user.nation);
          this.EmailType = { email: {} };
        }
      });
    } else if (action === 'new') {
      this.EmailType = {
        email: {
          brevoConfig: {
            smtpServer: 'smtp-relay.brevo.com',
            port: 587,
            username: '',
            password: '',
            fromEmail: '',
            fromName: '',
            useSSL: true,
          },
        },
      };
      this.popupSettingEmail = true;
      this.cSave = false;
    } else if (action === 'edit') {
      this.EmailType = Value;
      if (!this.EmailType.email.brevoConfig) {
        this.EmailType.email.brevoConfig = {
          smtpServer: 'smtp-relay.brevo.com',
          port: 587,
          username: '',
          password: '',
          fromEmail: '',
          fromName: '',
          useSSL: true,
        };
      }
      this.popupSettingEmail = true;
      this.cSave = true;
    } else if (action === 'cancel') {
      this.popupSettingEmail = false;
      this.EmailType = { email: {} };
      this.cSave = false;
    } else {
      if (!Value.emailType) {
        this.notifi('warning', 'Outgoing Mailbox Type is required!');
        return null;
      }
      if (!Value.email?.mailServer) {
        this.notifi('warning', 'Mail server is required!');
        return null;
      }
      if (!Value.email?.mailPort) {
        this.notifi('warning', 'Mail port is required!');
        return null;
      }
      if (!Value.email?.senderName) {
        this.notifi('warning', 'Sender Name is required!');
        return null;
      }
      if (!Value.email?.sender) {
        this.notifi('warning', 'Outgoing Email Account is required!');
        return null;
      }
      if (!Value.email?.password) {
        this.notifi('warning', 'Password is required!');
        return null;
      }
      this.http.post(env.notifyApiUrl + '/config/UpdateEmailSetting', Value).subscribe((rs: any) => {
        this.InitServiceType(this.user.nation);
        this.notifi('success', 'Update successfully.');
        this.EmailType = { email: {} };
        this.popupSettingEmail = false;
        this.cSave = false;
      });
    }
  }
}
