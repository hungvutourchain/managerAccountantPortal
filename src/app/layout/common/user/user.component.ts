import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { BooleanInput } from '@angular/cdk/coercion';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';
import { SignalRService } from 'app/core/signalr/signalr.service';
import { DialogUtility } from '@syncfusion/ej2-angular-popups';
import { ckeditConfig } from 'app/globals';
import { environment as env } from 'environments/environment';
import { AppFactory } from 'app/shared/lib/common.service';

@Component({
  standalone: false,
  selector: 'user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'user',
})
export class UserComponent implements OnInit, OnDestroy {
  /* eslint-disable @typescript-eslint/naming-convention */
  static ngAcceptInputType_showAvatar: BooleanInput;
  /* eslint-enable @typescript-eslint/naming-convention */
  popup_profile: boolean = false;
  globalsSendMessage: boolean = false;
  PopupSwitchRoles: boolean = false;
  PopupConfig: boolean = false;
  @Input() showAvatar: boolean = true;
  user: any;
  localConfig: any = {};
  dialogObj: any;
  showDoashboard: boolean = false;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  public insertImageSettings = {
    display: 'Block',
  };
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
  private hostUrl: string = document.location.origin + env.syncFileManagerLocal;
  public fileManagerSettings: any = {};
  
  /**
   * Constructor
   */
  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _userService: UserService,
    private _router: Router,
    private _signalRService: SignalRService,
    public afac: AppFactory
  ) {
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
  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to user changes
    this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: any) => {
      this.user = user;
      // Mark for check
      this._changeDetectorRef.markForCheck();
    });
    this.localConfig = this._userService.syncConfig();
    if (this.afac.getFeatureFlags()['showDoashboard']) {
      this.showDoashboard = true;
    }
    
    // Initialize SignalR connection when user is available
    this._signalRService.connect(this.user);
    
    // Start tracking user activity and page info
    this._signalRService.startActivityTracking();
    
    // // Listen for global messages
    this._signalRService.globalMessages
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((message) => {
        // Handle global messages here if needed
        console.log('[User Component] Global message received:', message);
      });
  }
  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(true);
    this._unsubscribeAll.complete();
    
    // Stop activity tracking and disconnect SignalR
    this._signalRService.stopActivityTracking();
    this._signalRService.disconnect();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Update the user status
   *
   * @param status
   */
  updateUserStatus(status: string): void {
    // Return if user is not available
    if (!this.user) {
      return;
    }

    // Update the user
    this._userService
      .update({
        ...this.user,
        status,
      })
      .subscribe();
  }

  /**
   * Sign out
   */
  signOut(): void {
    this._router.navigate(['/sign-out']);
  }

  openProfile() {
    this.popup_profile = true;
  }

  gotoDashboard() {
    this._router.navigate(['/dashboard']);
  }
  globalMessageContent: any = `
  <style type="text/css">body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .notification-container {
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .notification-header {
            background-color: #517abf;
            color: white;
            padding: 15px 20px;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
        }
        .notification-header i {
            margin-right: 10px;
            font-size: 24px;
        }
        .notification-body {
            padding: 20px;
        }
        .notification-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
        }
        .notification-message {
            color: #555;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        .feature-list {
            list-style-type: none;
            padding: 0;
        }
        .feature-list li {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: flex-start;
        }
        .feature-list li:last-child {
            border-bottom: none;
        }
        .feature-icon {
            background-color: #517abf;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .feature-content {
            flex: 1;
        }
        .feature-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        .feature-description {
            color: #666;
            font-size: 14px;
        }
        .notification-footer {
            background-color: #f9f9f9;
            padding: 15px 20px;
            text-align: right;
        }
        .btn {
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            outline: none;
        }
        .btn-primary {
            background-color: #4285f4;
            color: white;
            margin-left: 10px;
        }
        .btn-secondary {
            background-color: #f1f1f1;
            color: #333;
        }
    </style>
    <div class="notification-container">
    <div class="notification-header"><i>🔔</i> System Notification</div>

    <div class="notification-body">
    <div class="notification-title">System Update Available</div>

    <div class="notification-message">We&#39;re excited to announce that a new system update (v2.5.0) is now available. This update includes several new features and improvements to enhance your experience.</div>

    <h3>New Features:</h3>

    <ul class="feature-list">
      <li>
      <div class="feature-icon">✓</div>

      <div class="feature-content">
      <div class="feature-title">Dark Mode Support</div>

      <div class="feature-description">Enjoy a more comfortable viewing experience in low-light environments with our new system-wide dark mode.</div>
      </div>
      </li>
      <li>
      <div class="feature-icon">✓</div>

      <div class="feature-content">
      <div class="feature-title">Enhanced Security</div>

      <div class="feature-description">Improved authentication system with two-factor authentication and biometric login options.</div>
      </div>
      </li>
      <li>
      <div class="feature-icon">✓</div>

      <div class="feature-content">
      <div class="feature-title">Performance Optimization</div>

      <div class="feature-description">System now loads 30% faster and uses less memory for a smoother experience.</div>
      </div>
      </li>
      <li>
      <div class="feature-icon">✓</div>

      <div class="feature-content">
      <div class="feature-title">Advanced Analytics Dashboard</div>

      <div class="feature-description">New interactive charts and customizable reports to help you visualize your data better.</div>
      </div>
      </li>
      <li>
      <div class="feature-icon">✓</div>

      <div class="feature-content">
      <div class="feature-title">Collaborative Workspace</div>

      <div class="feature-description">Real-time collaboration tools allowing multiple users to work on the same project simultaneously.</div>
      </div>
      </li>
      <li>
      <div class="feature-icon">✓</div>

      <div class="feature-content">
      <div class="feature-title">Mobile Responsiveness</div>

      <div class="feature-description">Fully responsive design that works seamlessly across all devices and screen sizes.</div>
      </div>
      </li>
    </ul>
    </div>
    </div>
  
  `;
  ckeditConfig: any = { ...ckeditConfig, height: 500 };
  async sendGlobalMessage() {
    if (this.globalMessageContent) {
      let obj = {
        message: this.globalMessageContent,
        type: 'info',
        notify: true,
      };
      this.globalsSendMessage = false;
      try {
        await this._userService.sendMessageGlobal(obj).toPromise();
        this.globalMessageContent = '';
        console.log('[User Component] Global message sent successfully');
      } catch (error) {
        console.error('[User Component] Error sending global message:', error);
        // Show error message to user
        this.dialogObj = DialogUtility.alert({
          title: 'Error',
          content: `
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <div>
                <strong>Failed to send message!</strong>
                <p class="mb-0 mt-1">Please try again later.</p>
              </div>
            </div>
          `,
          okButton: {
            text: 'OK',
            click: () => {
              this.dialogObj.hide();
            },
          },
          position: { X: 'center', Y: 'center' },
          closeOnEscape: true,
          width: '400px',
        });
      }
    } else {
      this.dialogObj = DialogUtility.alert({
        title: 'Message Required',
        content: `
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <div>
              <strong>Message content is required!</strong>
              <p class="mb-0 mt-1">Please enter a message before sending.</p>
            </div>
          </div>
        `,
        okButton: {
          text: 'OK',
          click: () => {
            this.dialogObj.hide();
          },
        },
        position: { X: 'center', Y: 'center' },
        closeOnEscape: true,
        width: '400px',
      });
    }
  }
  resetToDefaults(): void {
    this.localConfig = {
      freezeNavbar: false,
      freezeToolbar: false,
      freezeInformation: false,
    };
    this.updateConfig();

    // Show confirmation message
    // You can use your existing notification service here
    console.log('Configuration reset to defaults');
  }
  updateConfig() {
    this._userService.saveConfig(this.localConfig);
  }
}
