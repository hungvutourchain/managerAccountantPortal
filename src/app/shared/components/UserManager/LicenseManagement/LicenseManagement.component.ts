import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as _ from 'lodash';
import { DbService } from '../../../connectData/db.service';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
// Thêm import cho LicenseService nếu chưa có
import { FormControl } from '@angular/forms';
import { LicenseService } from './license.service';

import { Observable, of } from 'rxjs';
@Component({
  standalone: false,
  selector: 'license-management-view',
  templateUrl: './LicenseManagement.component.html',
  styleUrls: ['./LicenseManagement.component.css'],
})
export class LicenseManagementComponent implements OnInit {
  public filterSettings: any = {
    caseSensitive: false,
    operator: 'contains',
  };
  @Input() user: any;
  @Input() lsDataStudent: any;
  @Input() listClass: any;
  @Input() listDepartment: any;
  public object: any = {};
  public filter: any = {};
  public lsobject: any = [];
  public cSave: boolean = false;
  public searchText: any = '';
  pageEvent: PageEvent = { previousPageIndex: 0, pageIndex: 0, pageSize: 10, length: 0 };
  pageSizeOptions: number[] = [10, 15, 20, 25, 30, 35, 40, 45, 50];
  totalitems = 0;

  // License Management properties
  licenseUsageReport: any = null;
  licenseUsageSummary: any = null;
  expiredLicenses: any[] = [];
  licenseExpirationReport: any = null;
  userLicenseDetails: any = null;

  // Filter properties
  dateRange: { start: Date; end: Date } = {
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
  };
  selectedNation: string = '';
  selectedLicenseType: string = '';

  // License types for dropdown
  licenseTypes: any[] = [
    { name: 'Basic', value: 'basic' },
    { name: 'Premium', value: 'premium' },
    { name: 'Enterprise', value: 'enterprise' },
  ];

  // Tab selection
  activeTab: string = 'usage';

  // Loading states
  isLoadingUsageReport: boolean = false;
  isLoadingSummary: boolean = false;
  isLoadingExpired: boolean = false;
  isLoadingExpiration: boolean = false;
  // Add new license properties
  showAddLicenseDialog: boolean = false;
  newLicense: {
    userId: any;
    licenseType: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    notes: string;
  } = {
    userId: null,
    licenseType: '',
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    notes: '',
  };

  // User search properties
  userSearchControl = new FormControl();
  filteredUsers: Observable<any[]> = of([]);
  allUsers: any[] = [];

  // -----------------------------------------------------
  constructor(
    private _snackBar: MatSnackBar,
    private dbService: DbService,
    private licenseService: LicenseService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }

  // -----------------------------------------------------
  loadInitialData() {
    this.getLicenseUsageSummary();
    this.getLicenseUsageReport();
  }

  // License Usage Report
  getLicenseUsageReport() {
    this.isLoadingUsageReport = true;
    const query = {
      nation: this.selectedNation,
      startDate: this.dateRange.start.toISOString(),
      endDate: this.dateRange.end.toISOString(),
      licenseType: this.selectedLicenseType,
    };

    this.dbService.GetLicenseUsageReport(query).subscribe(
      (data) => {
        this.licenseUsageReport = data;
        this.isLoadingUsageReport = false;
      },
      (error) => {
        this.notifi('Error', 'Failed to load license usage report');
        this.isLoadingUsageReport = false;
        console.error('Error loading license usage report:', error);
      }
    );
  }

  // License Usage Summary
  getLicenseUsageSummary() {
    this.isLoadingSummary = true;
    const query = {
      nation: this.selectedNation,
    };

    this.dbService.GetLicenseUsageSummary(query).subscribe(
      (data) => {
        this.licenseUsageSummary = data;
        this.isLoadingSummary = false;
      },
      (error) => {
        this.notifi('Error', 'Failed to load license usage summary');
        this.isLoadingSummary = false;
        console.error('Error loading license usage summary:', error);
      }
    );
  }

  // Expired Licenses
  getExpiredLicenses() {
    this.isLoadingExpired = true;
    const query = {
      nation: this.selectedNation,
      licenseType: this.selectedLicenseType,
    };

    this.dbService.GetExpiredLicenses(query).subscribe(
      (data) => {
        this.expiredLicenses = data;
        this.isLoadingExpired = false;
      },
      (error) => {
        this.notifi('Error', 'Failed to load expired licenses');
        this.isLoadingExpired = false;
        console.error('Error loading expired licenses:', error);
      }
    );
  }

  // License Expiration Report
  getLicenseExpirationReport() {
    this.isLoadingExpiration = true;
    const query = {
      nation: this.selectedNation,
      licenseType: this.selectedLicenseType,
    };

    this.dbService.GetLicenseExpirationReport(query).subscribe(
      (data) => {
        this.licenseExpirationReport = data;
        this.isLoadingExpiration = false;
      },
      (error) => {
        this.notifi('Error', 'Failed to load license expiration report');
        this.isLoadingExpiration = false;
        console.error('Error loading license expiration report:', error);
      }
    );
  }

  // Get User License Details
  getUserLicenseDetails(userId: string) {
    const query = {
      userId: userId,
    };

    this.dbService.GetUserLicenseDetails(query).subscribe(
      (data) => {
        this.userLicenseDetails = data;
        // You might want to open a dialog or panel to display this information
      },
      (error) => {
        this.notifi('Error', 'Failed to load user license details');
        console.error('Error loading user license details:', error);
      }
    );
  }

  // Filter change handlers
  onNationChange() {
    this.refreshData();
  }

  onLicenseTypeChange() {
    this.refreshData();
  }

  onDateRangeChange() {
    this.refreshData();
  }

  // Refresh data based on current filters
  refreshData() {
    switch (this.activeTab) {
      case 'usage':
        this.getLicenseUsageReport();
        this.getLicenseUsageSummary();
        break;
      case 'expired':
        this.getExpiredLicenses();
        break;
      case 'expiration':
        this.getLicenseExpirationReport();
        break;
      default:
        this.getLicenseUsageReport();
        this.getLicenseUsageSummary();
    }
  }

  // Tab change handler
  onTabChange(tabName: string) {
    this.activeTab = tabName;

    // Load data specific to the selected tab
    switch (tabName) {
      case 'usage':
        this.getLicenseUsageReport();
        this.getLicenseUsageSummary();
        break;
      case 'expired':
        this.getExpiredLicenses();
        break;
      case 'expiration':
        this.getLicenseExpirationReport();
        break;
    }
  }

  // Calculate days remaining until expiration
  getDaysRemaining(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get status class for expiration
  getExpirationStatusClass(daysToExpiration: number): string {
    if (daysToExpiration < 0) {
      return 'expired';
    } else if (daysToExpiration <= 7) {
      return 'critical';
    } else if (daysToExpiration <= 30) {
      return 'warning';
    } else {
      return 'good';
    }
  }

  // Format percentage for display
  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  // Pagination handler
  onPageChange(event: PageEvent) {
    this.pageEvent = event;
    this.refreshData();
  }
  isLoading: boolean = false;

  // Phương thức để gửi email nhắc nhở
  sendReminderEmail(licenseData: any): void {
    if (!licenseData) {
      console.error('License data is undefined or null');
      return;
    }

    this.isLoading = true;
    this.licenseService
      .sendReminderEmail(licenseData)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        (response) => {
          this.notifi('Success', 'Reminder email sent successfully');
        },
        (error) => {
          this.notifi('Error', 'Failed to send reminder email');
          console.error('Error sending reminder email:', error);
        }
      );
  }

  // Renew license
  renewLicense(licenseData: any): void {
    // Kiểm tra dữ liệu license
    if (!licenseData) {
      console.error('License data is undefined or null');
      return;
    }

    // Hiển thị dialog xác nhận
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Renew License',
        message: `Are you sure you want to renew the license for ${licenseData.userName || 'this user'}?`,
        confirmText: 'Renew',
        cancelText: 'Cancel',
      },
    });

    // Xử lý kết quả từ dialog
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Hiển thị loading indicator
        this.isLoading = true;

        // Gọi service để gia hạn license
        this.licenseService
          .renewLicense(licenseData.licenseId || licenseData.userId)
          .pipe(
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe(
            (response) => {
              // Hiển thị thông báo thành công
              this._snackBar.open('License renewed successfully', 'Close', {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
                panelClass: ['success-snackbar'],
              });

              // Làm mới dữ liệu
              this.refreshData();
            },
            (error) => {
              // Hiển thị thông báo lỗi
              this._snackBar.open('Failed to renew license: ' + (error.message || 'Unknown error'), 'Close', {
                duration: 5000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
                panelClass: ['error-snackbar'],
              });
              console.error('Error renewing license:', error);
            }
          );
      }
    });
  }

  // Add these missing properties
  selectedLicense: any = null;
  renewalInfo: {
    licenseType: string;
    endDate: Date;
    notes: string;
  } = {
    licenseType: '',
    endDate: new Date(),
    notes: '',
  };
  showRenewalDialog: boolean = false;
  isEditingLicense: boolean = false;
  confirmationDialogTitle: string = '';
  confirmationDialogMessage: string = '';
  showConfirmationDialog: boolean = false;
  pendingAction: string = '';
  editLicense(licenseDetails: any): void {
    // Store the selected license for editing
    this.selectedLicense = licenseDetails;

    // Initialize renewal info with current license details
    this.renewalInfo = {
      licenseType: licenseDetails.licenseType,
      endDate: new Date(licenseDetails.licenseExpiryDate),
      notes: 'License edited on ' + new Date().toLocaleDateString(),
    };

    // Show the renewal dialog which can be reused for editing
    this.showRenewalDialog = true;

    // Set a flag to indicate we're editing rather than renewing
    this.isEditingLicense = true;

    // Update dialog title if needed
    this.confirmationDialogTitle = 'Edit License';
    this.confirmationDialogMessage = `Are you sure you want to update the license for ${licenseDetails.userName}?`;
  }
  confirmRenewal(): void {
    // Validate inputs
    if (!this.renewalInfo.licenseType || !this.renewalInfo.endDate) {
      // Show error message
      this.showErrorMessage('Please fill in all required fields');
      return;
    }

    // Prepare confirmation dialog
    this.confirmationDialogTitle = this.isEditingLicense ? 'Confirm License Update' : 'Confirm License Renewal';
    this.confirmationDialogMessage = this.isEditingLicense
      ? `Are you sure you want to update the license for ${this.selectedLicense.userName}?`
      : `Are you sure you want to renew the license for ${
          this.selectedLicense.userName
        } until ${this.renewalInfo.endDate.toLocaleDateString()}?`;

    // Show confirmation dialog
    this.showConfirmationDialog = true;

    // Set the action to be performed when confirmed
    this.pendingAction = this.isEditingLicense ? 'editLicense' : 'renewLicense';
  }
  confirmAction(): void {
    // Close the confirmation dialog
    this.showConfirmationDialog = false;

    switch (this.pendingAction) {
      case 'renewLicense':
        // Existing renewal logic
        this.processLicenseRenewal();
        break;

      case 'editLicense':
        // Process license edit
        this.processLicenseEdit();
        break;

      case 'revokeLicense':
        // Existing revoke logic
        this.processLicenseRevocation();
        break;

      // Other cases...
    }
  }

  // Add this new method
  processLicenseEdit(): void {
    // Create the payload for the license update
    const updatePayload = {
      userId: this.selectedLicense.userId,
      licenseId: this.selectedLicense.licenseId,
      licenseType: this.renewalInfo.licenseType,
      expiryDate: this.renewalInfo.endDate,
      notes: this.renewalInfo.notes,
    };

    // Call your service to update the license
    this.licenseService.updateLicense(updatePayload).subscribe(
      (response) => {
        // Show success message
        this.showSuccessMessage(`License for ${this.selectedLicense.userName} has been updated successfully`);

        // Refresh the data
        this.loadData();

        // Reset flags and close dialogs
        this.isEditingLicense = false;
        this.showRenewalDialog = false;
      },
      (error) => {
        // Show error message
        this.showErrorMessage(`Failed to update license: ${error.message}`);
      }
    );
  }
  showErrorMessage(message: string): void {
    // Implement based on your notification system
    // For example, using MatSnackBar:
    this._snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  showSuccessMessage(message: string): void {
    // Implement based on your notification system
    this._snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
    });
  }
  // Add this method to process license renewal
  processLicenseRenewal(): void {
    // Create the payload for the license renewal
    const renewalPayload = {
      userId: this.selectedLicense.userId,
      licenseId: this.selectedLicense.licenseId,
      licenseType: this.renewalInfo.licenseType,
      expiryDate: this.renewalInfo.endDate,
      notes: this.renewalInfo.notes,
    };

    // Call your service to renew the license
    this.licenseService.renewLicense(renewalPayload.licenseId).subscribe(
      (response) => {
        // Show success message
        this.showSuccessMessage(`License for ${this.selectedLicense.userName} has been renewed successfully`);

        // Refresh the data
        this.loadData();

        // Reset flags and close dialogs
        this.isEditingLicense = false;
        this.showRenewalDialog = false;
      },
      (error) => {
        // Show error message
        this.showErrorMessage(`Failed to renew license: ${error.message}`);
      }
    );
  }

  // Add this method to process license revocation
  processLicenseRevocation(): void {
    // Create the payload for the license revocation
    const revocationPayload = {
      userId: this.selectedLicense.userId,
      licenseId: this.selectedLicense.licenseId,
      reason: this.renewalInfo.notes || 'License revoked by administrator',
    };

    // Call your service to revoke the license
    this.licenseService.revokeLicense(revocationPayload.licenseId).subscribe(
      (response) => {
        // Show success message
        this.showSuccessMessage(`License for ${this.selectedLicense.userName} has been revoked successfully`);

        // Refresh the data
        this.loadData();

        // Reset flags and close dialogs
        this.isEditingLicense = false;
        this.showRenewalDialog = false;
      },
      (error) => {
        // Show error message
        this.showErrorMessage(`Failed to revoke license: ${error.message}`);
      }
    );
  }

  // Add this method to load data
  loadData(): void {
    // Depending on the active tab, load the appropriate data
    switch (this.activeTab) {
      case 'usage':
        this.getLicenseUsageReport();
        this.getLicenseUsageSummary();
        break;
      case 'expired':
        this.getExpiredLicenses();
        break;
      case 'expiration':
        this.getLicenseExpirationReport();
        break;
      default:
        this.getLicenseUsageReport();
        this.getLicenseUsageSummary();
    }
  }
  /**
   * Initiates the license revocation process for a user
   * @param licenseDetails The license details to revoke
   */
  revokeLicense(licenseDetails: any): void {
    // Store the selected license for revocation
    this.selectedLicense = licenseDetails;

    // Initialize renewal info with current license details (we'll use this for notes)
    this.renewalInfo = {
      licenseType: licenseDetails.licenseType,
      endDate: new Date(), // Current date as revocation date
      notes: 'License revoked on ' + new Date().toLocaleDateString(),
    };

    // Prepare confirmation dialog
    this.confirmationDialogTitle = 'Revoke License';
    this.confirmationDialogMessage = `Are you sure you want to revoke the license for ${licenseDetails.userName}? This action cannot be undone.`;

    // Set the action to be performed when confirmed
    this.pendingAction = 'revokeLicense';

    // Show confirmation dialog
    this.showConfirmationDialog = true;
  }
  /**
   * Adds a new license based on the form data
   */
  addNewLicense(): void {
    // Validate the form data
    if (!this.newLicense.userId) {
      this.showErrorMessage('Please select a user');
      return;
    }
  
    if (!this.newLicense.licenseType) {
      this.showErrorMessage('Please select a license type');
      return;
    }
  
    if (!this.newLicense.startDate || !this.newLicense.endDate) {
      this.showErrorMessage('Please select both start and expiry dates');
      return;
    }
  
    // Ensure end date is after start date
    if (new Date(this.newLicense.endDate) <= new Date(this.newLicense.startDate)) {
      this.showErrorMessage('Expiry date must be after start date');
      return;
    }
  
    // Prepare the license data
    const licenseData = {
      userId: typeof this.newLicense.userId === 'object' ? this.newLicense.userId.id : this.newLicense.userId,
      licenseType: this.newLicense.licenseType,
      startDate: this.newLicense.startDate,
      expiryDate: this.newLicense.endDate,
      isActive: this.newLicense.isActive,
      notes: this.newLicense.notes || 'License created on ' + new Date().toLocaleDateString()
    };
  
    // Call the service to add the new license
    this.licenseService.addLicense(licenseData).subscribe(
      response => {
        // Show success message
        this.showSuccessMessage('New license has been added successfully');
        
        // Reset the form
        this.resetNewLicenseForm();
        
        // Close the dialog
        this.showAddLicenseDialog = false;
        
        // Refresh the data
        this.loadData();
      },
      error => {
        // Show error message
        this.showErrorMessage(`Failed to add license: ${error.message}`);
      }
    );
  }
  
  /**
   * Resets the new license form to default values
   */
  resetNewLicenseForm(): void {
    this.newLicense = {
      userId: null,
      licenseType: '',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      isActive: true,
      notes: ''
    };
  }
  // -----------------------------------------------------
  notifi(type, mes): void {
    this._snackBar.open(mes, type, {
      duration: 2000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  // --------------
}
