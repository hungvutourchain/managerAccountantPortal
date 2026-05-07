import { Component, OnInit } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { AppFactory } from 'app/shared/common.service';
import * as _ from 'lodash';
import { DbService } from '../../connectData/db.service';
import { PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { process } from 'app/shared/utils/data-query.util';
import { Base64 } from 'js-base64';
import * as $ from 'jquery';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: false,
  selector: 'manager-user',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersManagerComponent implements OnInit {
  // Enhanced validation states for username
  usernameValidation = {
    isChecking: false,
    isDuplicate: false,
    isValid: false,
    lastCheckedValue: '',
    message: ''
  };

  // Enhanced validation states for email
  emailValidation = {
    isChecking: false,
    isDuplicate: false,
    isValid: false,
    lastCheckedValue: '',
    message: ''
  };

  // Legacy properties for backward compatibility
  get duplicateUsername(): boolean { return this.usernameValidation.isDuplicate; }
  get duplicateEmail(): boolean { return this.emailValidation.isDuplicate; }

  private debounceTimers: { [key: string]: any } = {};

  // Enhanced username validation with debouncing and loading states
  checkDuplicateUsername() {
    const username = this.vlUsers.username?.trim();
    
    // Clear previous timer
    if (this.debounceTimers.username) {
      clearTimeout(this.debounceTimers.username);
    }

    // Reset validation if empty
    if (!username) {
      this.usernameValidation = {
        isChecking: false,
        isDuplicate: false,
        isValid: false,
        lastCheckedValue: '',
        message: ''
      };
      return;
    }

    // Don't check if it's the same value as last checked
    if (username === this.usernameValidation.lastCheckedValue) {
      return;
    }

    // Show loading state immediately for UX feedback
    this.usernameValidation.isChecking = true;
    this.usernameValidation.message = 'Checking username availability...';

    // Debounce the actual validation
    this.debounceTimers.username = setTimeout(() => {
      this.performUsernameValidation(username);
    }, 500);
  }

  private performUsernameValidation(username: string) {
    try {
      const normalizedUsername = username.toLowerCase();
      const isDuplicate = this.lsUsers.some(
        (u: any) => u.username && 
        u.username.trim().toLowerCase() === normalizedUsername && 
        u._id !== this.vlUsers._id
      );

      this.usernameValidation = {
        isChecking: false,
        isDuplicate: isDuplicate,
        isValid: !isDuplicate && username.length >= 3,
        lastCheckedValue: username,
        message: isDuplicate 
          ? `Username "${username}" is already taken. Please choose a different username.`
          : username.length < 3 
            ? 'Username must be at least 3 characters long.'
            : `Username "${username}" is available.`
      };
    } catch (error) {
      this.usernameValidation = {
        isChecking: false,
        isDuplicate: false,
        isValid: false,
        lastCheckedValue: username,
        message: 'An error occurred while checking username. Please try again.'
      };
    }
  }

  // Enhanced email validation with debouncing and loading states
  checkDuplicateEmail() {
    const email = this.vlUsers.email?.trim();
    
    // Clear previous timer
    if (this.debounceTimers.email) {
      clearTimeout(this.debounceTimers.email);
    }

    // Reset validation if empty
    if (!email) {
      this.emailValidation = {
        isChecking: false,
        isDuplicate: false,
        isValid: false,
        lastCheckedValue: '',
        message: ''
      };
      return;
    }

    // Don't check if it's the same value as last checked
    if (email === this.emailValidation.lastCheckedValue) {
      return;
    }

    // Show loading state immediately for UX feedback
    this.emailValidation.isChecking = true;
    this.emailValidation.message = 'Checking email availability...';

    // Debounce the actual validation
    this.debounceTimers.email = setTimeout(() => {
      this.performEmailValidation(email);
    }, 500);
  }

  private performEmailValidation(email: string) {
    try {
      const normalizedEmail = email.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(email);
      
      if (!isValidFormat) {
        this.emailValidation = {
          isChecking: false,
          isDuplicate: false,
          isValid: false,
          lastCheckedValue: email,
          message: 'Invalid email format. Please enter a valid email address.'
        };
        return;
      }

      const isDuplicate = this.lsUsers.some(
        (u: any) => u.email && 
        u.email.trim().toLowerCase() === normalizedEmail && 
        u._id !== this.vlUsers._id
      );

      this.emailValidation = {
        isChecking: false,
        isDuplicate: isDuplicate,
        isValid: !isDuplicate && isValidFormat,
        lastCheckedValue: email,
        message: isDuplicate 
          ? `Email "${email}" is already in use. Please use a different email address.`
          : `Email "${email}" is available.`
      };
    } catch (error) {
      this.emailValidation = {
        isChecking: false,
        isDuplicate: false,
        isValid: false,
        lastCheckedValue: email,
        message: 'An error occurred while checking email. Please try again.'
      };
    }
  }

  // Method to clear validation when switching between create/edit modes
  clearValidationStates() {
    this.usernameValidation = {
      isChecking: false,
      isDuplicate: false,
      isValid: false,
      lastCheckedValue: '',
      message: ''
    };

    this.emailValidation = {
      isChecking: false,
      isDuplicate: false,
      isValid: false,
      lastCheckedValue: '',
      message: ''
    };

    // Clear any pending timers
    Object.keys(this.debounceTimers).forEach(key => {
      if (this.debounceTimers[key]) {
        clearTimeout(this.debounceTimers[key]);
        delete this.debounceTimers[key];
      }
    });
  }

  // Helper method to check if the form has validation errors
  hasValidationErrors(): boolean {
    return (
      this.usernameValidation.isDuplicate ||
      this.emailValidation.isDuplicate ||
      this.usernameValidation.isChecking ||
      this.emailValidation.isChecking ||
      (!this.usernameValidation.isValid && this.usernameValidation.lastCheckedValue.length > 0 && !this.usernameValidation.isChecking) ||
      (!this.emailValidation.isValid && this.emailValidation.lastCheckedValue.length > 0 && !this.emailValidation.isChecking)
    );
  }

  // Helper method to check if form is invalid for submission
  isFormInvalid(): boolean {
    return this.saving || this.hasValidationErrors() || this.isRequiredFieldsEmpty();
  }

  // Helper method to check if required fields are empty
  isRequiredFieldsEmpty(): boolean {
    return !this.vlUsers.username?.trim() || !this.vlUsers.email?.trim();
  }

  // Helper method to get submit button title with validation info
  getSubmitButtonTitle(): string {
    if (this.saving) {
      return 'Processing...';
    }
    if (this.usernameValidation.isDuplicate || this.emailValidation.isDuplicate) {
      return 'Please resolve duplicate errors before saving';
    }
    if (this.usernameValidation.isChecking || this.emailValidation.isChecking) {
      return 'Validating data...';
    }
    if (this.isRequiredFieldsEmpty()) {
      return 'Please fill in all required fields';
    }
    return !!this.cSave ? 'Update user information' : 'Add new user';
  }

  public filterSettings: any = {
    caseSensitive: false,
    operator: 'contains',
  };
  loading: boolean = true;
  // Add user license properties
  userLicenses: any[] = [];
  selectedUserForLicense: any = null;
  licensePopupOpen: boolean = false;
  licenseInfo: any = {};
  licenseTypes: any = {};
  
  // Company license statistics
  companyLicenseStats: any[] = [];
  showLicenseStats: boolean = false;
  showLicenseDetails: boolean = false;
  statsSearchText: string = '';
  statsSortBy: string = 'companyName';
  statsSortDirection: 'asc' | 'desc' = 'asc';

  titelPage: any = 'User Manager | Tourchain';
  lsRole: any = [
    { name: 'User', code: 'User', note: 'Basic user with limited access permissions' },
    { name: 'View', code: 'View', note: 'Read-only access to view data without modification rights' },
    { name: 'Product', code: 'Product', note: 'Manage tour products, packages, and service offerings' },
    { name: 'Reservation', code: 'Reservation', note: 'Handle bookings, reservations, and customer inquiries' },
    { name: 'Admin', code: 'Admin', note: 'Administrative access with user and system management capabilities' },
    { name: 'Admin System', code: 'AdminSystem', note: 'Full system administration with complete access control' },
    { name: 'Report', code: 'Report', note: 'Generate and access various business reports and analytics' },
    { name: 'Leader', code: 'Leader', note: 'Team leadership role with staff supervision responsibilities' },
    {
      name: 'Reservation Manager',
      code: 'ReservationManager',
      note: 'Oversee reservation operations and team management',
    },
    { name: 'Operation Manager (OM)', code: 'OM', note: 'Manage daily operations, logistics, and service delivery' },
    { name: 'Operation', code: 'Operation', note: 'Execute operational tasks and coordinate service activities' },
    { name: 'Accounting', code: 'Accounting', note: 'Handle financial transactions, invoicing, and basic accounting' },
    {
      name: 'Accounting Manager',
      code: 'AccountingManager',
      note: 'Supervise accounting team and financial processes',
    },
    {
      name: 'Finance Manager',
      code: 'FinanceManager',
      note: 'Oversee financial planning, budgeting, and strategic decisions',
    },
    { name: 'Accounts Receivable', code: 'AccountsReceivable', note: 'Manage incoming payments and customer billing' },
    { name: 'Accounts Payable', code: 'AccountsPayable', note: 'Handle outgoing payments and vendor transactions' },
  ];
  lsTypesEmail: any = [
    { name: 'Reset Password', value: 'reset' },
    { name: 'Info', value: 'info' },
  ];
  user: any;
  filter: any = {};
  listData: any = {};
  OptionSendEmail: any = {};
  createSurvey: boolean = false;
  pageEvent: PageEvent = { previousPageIndex: 0, pageIndex: 0, pageSize: 10, length: 0 };
  pageSizeOptions: number[] = [10, 15];
  totalitems = 0;
  listCompany: any;
  listCourse: any;
  listDepartment: any;
  listClass: any;
  lsUsers: any = [];
  lsTemplateEmailStudent: any = [];
  ConfigAsiaReimagined: any;
  lsCountry: any = [];

  // -----------------------------------------------------
  constructor(
    private _userService: UserService,
    private _snackBar: MatSnackBar,
    private dbService: DbService,
    private titleService: Title
  ) {
    this.lsRole = _.orderBy(this.lsRole, 'name', 'asc');
  }

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  async reloadSerivce() {
    try {
      let [
        lsUsers,
        listCompany,
        listCourse,
        // listDepartment, listClass,
        lsTemplateEmailStudent,
        ConfigAsiaReimagined,
        lsCountry,
      ] = await Promise.all([
        this.dbService.GetUsersSeting(this.user.nation).toPromise(),
        this.dbService.GetCompany(this.user.nation).toPromise(),
        this.dbService.GetCourse(this.user.nation).toPromise(),
        // this.dbService.GetDepartment(this.user.nation).toPromise(),
        // this.dbService.GetClass(this.user.nation).toPromise(),
        this.dbService.GetTemplateEmailStudent(this.user.nation).toPromise(),
        this.dbService.ConfigAdmin().toPromise(),
        this.dbService.getCountries().toPromise(),
      ]);
      this.lsUsers = lsUsers;
      this.lsCountry = lsCountry;
      this._oderby();
      this.listCompany = listCompany;
      this.listCourse = listCourse;
      // this.listDepartment = listDepartment
      // this.listClass = listClass
      this.lsTemplateEmailStudent = lsTemplateEmailStudent;
      this.ConfigAsiaReimagined = ConfigAsiaReimagined;
      this.reloadInfoUser();
      this.getLicenseTypes();
      this.loadDataStudent();
      this.initExchangeRateGroup();
      this.generateCompanyLicenseStatistics();
    } catch (err) {
      this.notifi('error', 'Load data fail !');
      console.log('Load data fail!', err);
    }
  }

  // Add user license properties
  // Add user license management methods
  async openLicenseDialog(user: any) {
    try {
      this.loading = true;
      this.selectedUserForLicense = user;
      
      // Show dialog immediately with loading state
      this.licensePopupOpen = true;
      
      // Load both user licenses and license types in parallel
      const [licenseInfo, licenseTypes] = await Promise.all([
        this.dbService.getUserLicenses(user._id).toPromise().catch(error => {
          console.warn('Failed to load user license info:', error);
          return {}; // Return empty object as fallback
        }),
        this.dbService.getLicenseTypes().toPromise().catch(error => {
          console.warn('Failed to load license types:', error);
          return {}; // Return empty object as fallback
        })
      ]);
      
      // Set the loaded data
      this.licenseInfo = licenseInfo || { isActive: false, userId: user._id };
      this.licenseTypes = licenseTypes || {};
      
      // Ensure we have basic license info structure
      if (!this.licenseInfo.userId) {
        this.licenseInfo.userId = user._id;
      }
      
      // Log for debugging
      console.log('License dialog opened for user:', user);
      console.log('Loaded license info:', this.licenseInfo);
      console.log('Loaded license types:', this.licenseTypes);
      
      this.loading = false;
    } catch (error) {
      this.loading = false;
      this.licensePopupOpen = false;
      this.notifi('error', 'Failed to load license information. Please try again.');
      console.error('Error opening license dialog:', error);
    }
  }

  updateUserLicense() {
    // Validate license data before sending to server
    if (!this.licenseInfo || !this.licenseTypes || !this.selectedUserForLicense) {
      this.notifi('error', 'Invalid license data - please try reopening the license dialog');
      return;
    }

    // Create a copy of the license info to send to the server
    // Toggle the isActive state based on current status
    const newIsActiveState = !this.licenseInfo.isActive;

    // Check if we're trying to activate a license and if we're at the limit
    if (newIsActiveState && !this.canActivateLicense()) {
      const maxLicenses = this.licenseTypes.maxLicenses || 0;
      const usedLicenses = this.licenseTypes.usedLicenses || 0;
      this.notifi('error', `Cannot activate license: Maximum licenses (${maxLicenses}) already in use. Currently using ${usedLicenses} licenses.`);
      return;
    }
    
    const licenseData = {
      userId: this.selectedUserForLicense._id,
      id: this.licenseInfo._id || this.licenseInfo.id || null, // Don't fallback to licenseTypes._id!
      licenseType: this.licenseTypes._id,
      isActive: newIsActiveState,  // Toggle the state
      updatedAt: new Date(),
    };

    console.log(`Toggling license from ${this.licenseInfo.isActive} to ${newIsActiveState}`);

    // Validation: Check required fields
    if (!licenseData.userId) {
      this.notifi('error', 'User ID is required');
      return;
    }

    console.log('Sending license data:', licenseData); // Debug log
    console.log('Selected user:', this.selectedUserForLicense); // Debug log
    console.log('License info:', this.licenseInfo); // Debug log
    console.log('License types:', this.licenseTypes); // Debug log

    this.loading = true;

    this.dbService.updateUserLicense(licenseData).subscribe(
      (response: any) => {
        this.loading = false;
        console.log('License update response:', response); // Debug log
        
        if (response && (response.success !== false)) {
          const message = response.message || 
            (newIsActiveState ? 'License activated successfully' : 'License deactivated successfully');
          
          this.notifi('success', message);
          
          // Update the local license info immediately
          this.licenseInfo.isActive = newIsActiveState;
          
          this.reloadUsers();
          
          // Update the license types data to reflect new usage
          this.getLicenseTypes();
          
          // Refresh the current dialog data if we're staying in the dialog
          if (this.licensePopupOpen && this.selectedUserForLicense) {
            // Refresh user license data
            this.dbService.getUserLicenses(this.selectedUserForLicense._id).subscribe(
              (updatedLicenseInfo) => {
                this.licenseInfo = updatedLicenseInfo || {};
              },
              (error) => {
                console.error('Error refreshing license info:', error);
              }
            );
          } else {
            this.licensePopupOpen = false;
          }
        } else {
          this.notifi('error', response.message || 'Failed to update license');
        }
      },
      (error) => {
        this.loading = false;
        let errorMessage = 'Failed to update license';
        
        console.error('License update error details:', error); // Add detailed logging
        
        // Extract error message from server response
        if (error && error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
            // Add details if available for debugging
            if (error.error.details) {
              errorMessage += ` (${error.error.details})`;
            }
          } else if (error.error.title) {
            errorMessage = error.error.title;
          }
        } else if (error && error.message) {
          errorMessage = error.message;
        }
        
        // Handle specific error cases
        if (errorMessage.includes('Maximum licenses') || errorMessage.includes('license limit')) {
          // This is a validation error, keep the dialog open so user can see the current state
          this.notifi('error', errorMessage);
        } else {
          // For other errors, we might want to close the dialog
          this.notifi('error', errorMessage);
          this.licensePopupOpen = false;
        }
        
        console.error('Error updating license:', error);
      }
    );
  }
  reloadUsers() {
    this.getLicenseTypes();
    this.dbService.GetUsersSeting(this.user.nation).subscribe((rs) => {
      this.lsUsers = rs;
      this._oderby();
      this.loadDataStudent();
      this.generateCompanyLicenseStatistics(); // Refresh statistics
    });
  }
  getLicenseTypes() {
    this.dbService.getLicenseTypes().subscribe(
      (response: any) => {
        this.licenseTypes = response || {};
      },
      (error) => {
        this.notifi('error', 'Failed to load license types');
        console.error('Error loading license types:', error);
      }
    );
  }
  deactivateLicense(licenseId: string) {
    const updateData = {
      _id: licenseId,
      isActive: false,
      updatedAt: new Date(),
    };

    this.loading = true;

    this.dbService.updateUserLicense(updateData).subscribe(
      (response: any) => {
        this.loading = false;
        if (response && (response.success !== false)) {
          this.notifi('success', 'License deactivated successfully');
          this.reloadUsers();
          // Refresh the license dialog if it's still open
          if (this.licensePopupOpen && this.selectedUserForLicense) {
            this.openLicenseDialog(this.selectedUserForLicense);
          }
        } else {
          this.notifi('error', response.message || 'Failed to deactivate license');
        }
      },
      (error) => {
        this.loading = false;
        let errorMessage = 'Failed to deactivate license';
        
        // Extract error message from server response
        if (error && error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        }
        
        this.notifi('error', errorMessage);
        console.error('Error deactivating license:', error);
      }
    );
  }

  revokeLicense(revocationReason?: string) {
    if (!this.licenseInfo || (!this.licenseInfo._id && !this.licenseInfo.id)) {
      this.notifi('error', 'Invalid license data - cannot revoke license');
      return;
    }

    // Confirm revocation with user
    if (confirm('Are you sure you want to permanently revoke this license? This action cannot be undone.')) {
      const revokeData = {
        id: this.licenseInfo._id || this.licenseInfo.id || this.licenseTypes._id,
        revocationReason: revocationReason || 'Revoked by administrator'
      };

      console.log('Revoking license with data:', revokeData); // Debug log

      this.loading = true;

      this.dbService.revokeLicense(revokeData).subscribe(
        (response: any) => {
          this.loading = false;
          console.log('License revocation response:', response); // Debug log
          
          if (response && (response.success !== false || response === true)) {
            this.notifi('success', 'License revoked successfully');
            this.reloadUsers();
            
            // Update the license types data to reflect new usage
            this.getLicenseTypes();
            
            // Close the dialog since the license is now revoked
            this.licensePopupOpen = false;
          } else {
            this.notifi('error', response.message || 'Failed to revoke license');
          }
        },
        (error) => {
          this.loading = false;
          let errorMessage = 'Failed to revoke license';
          
          console.error('License revocation error details:', error); // Add detailed logging
          
          // Extract error message from server response
          if (error && error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.title) {
              errorMessage = error.error.title;
            }
          } else if (error && error.message) {
            errorMessage = error.message;
          }
          
          this.notifi('error', errorMessage);
          console.error('Error revoking license:', error);
        }
      );
    }
  }

  closeLicenseDialog() {
    this.licensePopupOpen = false;
    this.selectedUserForLicense = null;
  }

  // Add method to check license availability
  canActivateLicense(): boolean {
    if (!this.licenseTypes || !this.licenseTypes.maxLicenses) {
      return false;
    }
    
    const currentUsedLicenses = this.licenseTypes.usedLicenses || 0;
    const maxLicenses = this.licenseTypes.maxLicenses || 0;
    
    return currentUsedLicenses < maxLicenses;
  }

  // Add method to get remaining license count
  getRemainingLicenses(): number {
    if (!this.licenseTypes) {
      return 0;
    }
    
    const currentUsedLicenses = this.licenseTypes.usedLicenses || 0;
    const maxLicenses = this.licenseTypes.maxLicenses || 0;
    
    return Math.max(0, maxLicenses - currentUsedLicenses);
  }

  // -----------------------------------------------------
  notifi(type, mes): void {
    this._snackBar.open(mes, type, {
      duration: 2000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  ngOnInit() {
    this.setTitle(this.titelPage);
    let filterShow = this.menuLeft.filter((x) => x.show);
    this.field = {
      dataSource: filterShow,
      id: 'id',
      parentID: 'pid',
      text: 'name',
      hasChildren: 'hasChild',
      selected: 'selected',
      iconCss: 'icon',
    };
    this.NameTab = 'Users';
    this._userService.user$.subscribe((user: any) => {
      if (user && user?._id) {
        this.user = user;
        this.reloadSerivce();
      }
    });
  }

  // for student data
  public gridViewStudent: any[];
  lsDataStudent: any = [];
  public mySelectionStudent: string[] = [];
  dataBindingStudent: any;

  loadDataStudent() {
    this.reloadInfoUser();
    this.lsDataLecturer = _.filter(this.lsUsers, (o: any) => {
      return (
        _.findIndex(o.role, (x: any) => {
          return x.code === 'Admin';
        }) >= 0
      );
    });
    this.lsDataStudent = this.lsUsers;
    // this.lsDataStudent.forEach(x => {
    //   if (x.departmentId) {
    //     let temp = this.lsDataLecturer.find(n => _.findIndex(n.listDepartment, (m: any) => { return m === x.departmentId; }) >= 0);
    //     if (temp) x.lecturer = temp.fullname
    //   }
    // });
    this.gridViewStudent = this.lsDataStudent;
    this.refreshGridView();
    this.loading = false;
    
    // Update license statistics if they are being shown
    if (this.showLicenseStats) {
      this.generateCompanyLicenseStatistics();
    }
  }
  refreshGridView() {
    if (this.gridViewStudent) {
      this.gridViewStudent = [...this.lsDataStudent];

      if (this.dataBindingStudent) {
        this.dataBindingStudent.skip = 0;
      }
    }
  }
  public onFilterStudent(inputValue: string): void {
    this.gridViewStudent = process(this.lsDataStudent, {
      filter: {
        logic: 'or',
        filters: [
          {
            field: 'usercode',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'username',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'fullname',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'email',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'lastName',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'firstName',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'fullname',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'company',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'course',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'class',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'department',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'lecturer',
            operator: 'contains',
            value: inputValue,
          },
        ],
      },
    }).data;
    this.dataBindingStudent.skip = 0;
  }

  popupAssignStudent: boolean = false;
  isUpdateAssignStudent: boolean = false;
  lsTempStudent: any;
  objectAssignStudent: any = {};
  pushListDoneStudent: any = [];

  AssignStudent(action = false) {
    if (!action) {
      this.lsTempStudent = this.gridViewStudent.filter((x) => x.selected);
      if (this.lsTempStudent.length) {
        this.isUpdateAssignStudent = false;
        this.popupAssignStudent = true;
        this.pushListDoneStudent = [];
      } else alert('Please, Selete a student');
    } else {
      if (this.objectAssignStudent.companyId && this.objectAssignStudent.courseId && this.objectAssignStudent.classId) {
        this.isUpdateAssignStudent = true;
        this.lsTempStudent.forEach(async (x) => {
          if (this.objectAssignStudent.companyId) {
            x.companyId = this.objectAssignStudent.companyId._id;
            x.company = this.objectAssignStudent.companyId.name;
          }
          if (this.objectAssignStudent.courseId) {
            x.courseId = this.objectAssignStudent.courseId._id;
            x.course = this.objectAssignStudent.courseId.name;
          }
          if (this.objectAssignStudent.classId) {
            x.classId = this.objectAssignStudent.classId._id;
            x.class = this.objectAssignStudent.classId.name;
          }
          if (this.objectAssignStudent.departmentId) {
            x.departmentId = this.objectAssignStudent.departmentId._id;
            x.department = this.objectAssignStudent.departmentId.name;
          }
          try {
            let [isdone] = await Promise.all([this.dbService.UpdateUsersSeting(x).toPromise()]);
            this.pushListDoneStudent.push({
              isUpdateDone: isdone,
              usercode: x.usercode,
              fullname: x.fullname,
            });
          } catch (err) {
            this.notifi('error', 'Load data fail !');
            this.pushListDoneLecturer.push({
              isUpdateDone: false,
              usercode: x.usercode,
              fullname: x.fullname,
            });
          }
        });
      } else {
        alert('Please, Selete company, course, class');
      }
    }
  }
  licenseTypePopupOpen: boolean = false;
  licenseTypeForm: any = {};

  openLicenseTypeDialog() {
    this.licenseTypeForm = { ...this.licenseTypes };
    if (!this.licenseTypeForm.metadata) {
      this.licenseTypeForm.metadata = {};
    }
    this.licenseTypePopupOpen = true;
  }

  UpdatelicenseTypes() {
    this.loading = true;
    this.dbService.UpdatelicenseTypes(this.licenseTypeForm).subscribe(
      (response: any) => {
        this.notifi('success', 'License type updated successfully');
        this.licenseTypePopupOpen = false;
        this.getLicenseTypes(); // Refresh the license types data
        this.loading = false;
      },
      (error) => {
        this.notifi('error', 'Failed to update license type');
        console.error('Error updating license type:', error);
        this.loading = false;
      }
    );
  }

  closeLicenseTypeDialog() {
    this.licenseTypePopupOpen = false;
  }
  selectedAllStudent: boolean = false;

  public SelectAllStudent(env) {
    this.gridViewStudent.forEach((x) => {
      x.selected = env;
    });
    this.selectedAllStudent = env;
  }

  vlUsers: any = { role: [], serviceType: [] };
  cSave: any = false;
  openDialog: boolean = false;
  saving: boolean = false;

  UsersValue(action, Users) {
    if (action === 'delete') {
      if (confirm('Are you sure to delete?')) {
        this.dbService.RemoveUsersSeting(Users).subscribe((rs: any) => {
          this.reloadUsers();
        });
      }
    } else if (action === 'open') {
      this.vlUsers = {
        role: [
          { name: 'Product', code: 'Product' },
          { name: 'Operation', code: 'Operation' },
          { name: 'Reservation', code: 'Reservation' },
        ],
      };
      this.cSave = false;
      this.openDialog = true;
    } else if (action === 'add') {
      this.saving = true;
      let temp = _.cloneDeep(this.vlUsers);
      temp.nation = this.user.nation;
      this.dbService.AddUsersSeting(temp).subscribe((rs: any) => {
        if (rs) {
          this.vlUsers = { role: [] };
          this.dbService.GetUsersSeting(this.user.nation).subscribe((rs: any) => {
            this.lsUsers = rs;
            this.loadDataStudent();
            this._oderby();
          });
          this.saving = false;
          this.openDialog = false;
        }
      });
    } else if (action === 'edit') {
      let object = Users;
      this.vlUsers = object;
      this.cSave = true;
      this.openDialog = true;
    } else {
      this.saving = true;
      this.dbService.UpdateUsersSeting(Users).subscribe((rs: any) => {
        this.vlUsers = { role: [] };
        this.cSave = false;
        this.openDialog = false;
        this.saving = false;
        if (!Users.active) {
          this.reloadUsers();
        } else {
          this.loadDataLecturer();
          this._oderby();
        }
      });
    }
  }

  lsTempStudentEmail: any = [];
  lsTempNoEmail: any = [];
  pupupNoEmail: boolean = false;
  popupInputContentEmailStudent: boolean = false;

  SendEmailStudent() {
    this.lsTempNoEmail = [];
    let tempObjectEmail =
      this.lsTemplateEmailStudent && this.lsTemplateEmailStudent.length ? this.lsTemplateEmailStudent[0] : {};
    this.OptionSendEmail = {
      template: tempObjectEmail._id || null,
      type: tempObjectEmail.types || null,
      content: tempObjectEmail.content || null,
    };
    this.lsTempStudentEmail = this.gridViewStudent.filter((x) => x.selected);
    if (this.lsTempStudentEmail.length) {
      let tempNoEmail = this.lsTempStudentEmail.filter((x) => !x.email);
      if (tempNoEmail.length) {
        tempNoEmail.forEach((x) => {
          this.lsTempNoEmail.push({
            status: 'No Email',
            usercode: x.usercode,
            fullname: x.fullname,
          });
        });
        this.pupupNoEmail = true;
      } else {
        this.popupInputContentEmailStudent = true;
        this.isSendEmailStudent = false;
      }
    } else alert('Please, Selete a student');
  }

  SubjectStudent: any = '';
  pushListDoneStudentEmail: any = [];
  isSendEmailStudent: boolean = false;

  SubmitSendEmailStudent() {
    if (this.SubjectStudent) {
      this.isSendEmailStudent = true;
      this.value = 0;
      this.pushListDoneStudentEmail = [];
      this.lsTempStudentEmail.forEach((items, i) => {
        setTimeout(() => {
          let text = _.cloneDeep(this.OptionSendEmail.content);
          text = text.replace('[#UserCode#]', items.usercode || '');
          text = text.replace('[#FullName#]', items.fullname || '');
          text = text.replace('[#UserEmail#]', items.email || '');
          text = text.replace('[#UserCompany#]', items.company || '');
          text = text.replace('[#UserCourse#]', items.course || '');
          var status: any = null;
          // send Email
          if (this.OptionSendEmail.type === 'reset') {
            status = this.submitForgotPassword(items.email, this.user.nation, this.SubjectStudent, text);
          } else {
            this.SendEmail(items.email, this.SubjectStudent, text);
            status = true;
          }
          // End send Email

          this.pushListDoneStudentEmail.push({
            isUpdateDone: status,
            usercode: items.usercode,
            fullname: items.fullname,
          });
          // index =  100%
          // this.pushListDoneStudentEmail.length = this.value
          this.value = Math.ceil((this.pushListDoneStudentEmail.length * 100) / this.lsTempStudentEmail.length);
          console.log(this.value);
        }, i * 20000);
      });
    } else alert('Please, Enter Subject!');
  }

  // ========================================================================
  // for Lecturer data
  lsDataLecturer: any = [];
  public gridViewLecturer: any[];
  public mySelectionLecturer: string[] = [];
  // REMOVED: DataBindingDirective not found (was from Kendo)
  // @ViewChild(DataBindingDirective, { static: false }) dataBindingLecturer: DataBindingDirective;

  loadDataLecturer() {
    this.reloadInfoUser();
    this.lsDataLecturer = _.filter(this.lsUsers, (o: any) => {
      return (
        _.findIndex(o.role, (x: any) => {
          return x.code === 'Admin';
        }) >= 0
      );
    });
    this.lsDataLecturer.forEach((item) => {
      item.listName = [];
      item.listDepartmentName = [];
      item.listCourseName = [];
      if (item.listClass && item.listClass.length) {
        item.listClass.forEach((x) => {
          let temp = this.listClass.find((cl) => cl._id === x);
          if (temp) item.listName.push(temp.name);
        });
      }
      if (item.listDepartment && item.listDepartment.length) {
        item.listDepartment.forEach((x) => {
          let temp = this.listDepartment.find((cl) => cl._id === x);
          if (temp) item.listDepartmentName.push(temp.name);
        });
      }
      if (item.listCourse && item.listCourse.length) {
        item.listCourse.forEach((x) => {
          let temp = this.listCourse.find((cl) => cl._id === x);
          if (temp) item.listCourseName.push(temp.name);
        });
      }
    });
    this.gridViewLecturer = this.lsDataLecturer;
  }

  public onFilterLecturer(inputValue: string): void {
    this.gridViewLecturer = process(this.lsDataLecturer, {
      filter: {
        logic: 'or',
        filters: [
          {
            field: 'usercode',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'fullname',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'company',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'course',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'class',
            operator: 'contains',
            value: inputValue,
          },
          {
            field: 'department',
            operator: 'contains',
            value: inputValue,
          },
        ],
      },
    }).data;
    // REMOVED: DataBindingDirective not found (was from Kendo)
    // this.dataBindingLecturer.skip = 0;
  }

  popupAssignLecturer: boolean = false;
  isUpdateAssignLecturer: boolean = false;
  lsTempLecturer: any;
  objectAssignLecturer: any = {};
  pushListDoneLecturer: any = [];

  AssignLecturer(action = false) {
    if (!action) {
      this.lsTempLecturer = this.gridViewLecturer.filter((x) => x.selected);
      if (this.lsTempLecturer.length) {
        this.isUpdateAssignLecturer = false;
        this.popupAssignLecturer = true;
        this.pushListDoneLecturer = [];
      } else alert('Please, Selete a Lecturer');
    } else {
      if (
        this.objectAssignLecturer.companyId &&
        this.objectAssignLecturer.courseId &&
        this.objectAssignLecturer.listClass
      ) {
        this.isUpdateAssignLecturer = true;
        this.lsTempLecturer.forEach(async (x) => {
          if (this.objectAssignLecturer.companyId) {
            x.companyId = this.objectAssignLecturer.companyId._id;
            x.company = this.objectAssignLecturer.companyId.name;
          }
          if (this.objectAssignLecturer.courseId) {
            x.courseId = this.objectAssignLecturer.courseId._id;
            x.course = this.objectAssignLecturer.courseId.name;
          }
          if (this.objectAssignLecturer.listClass) {
            x.listClass = this.objectAssignLecturer.listClass;
          }
          try {
            let [isdone] = await Promise.all([this.dbService.UpdateUsersSeting(x).toPromise()]);
            this.pushListDoneLecturer.push({
              isUpdateDone: isdone,
              usercode: x.usercode,
              fullname: x.fullname,
            });
          } catch (err) {
            this.notifi('error', 'Load data fail !');
            console.log('Load data fail!', err);
            this.pushListDoneLecturer.push({
              isUpdateDone: false,
              usercode: x.usercode,
              fullname: x.fullname,
            });
          }
        });
        this.loadDataLecturer();
      } else {
        alert('Please, Selete company, course, class');
      }
    }
  }

  selectedAllLecturer: boolean = false;

  public SelectAllLecturer(env) {
    this.gridViewLecturer.forEach((x) => {
      x.selected = env;
    });
    this.selectedAllLecturer = env;
  }

  vlUsersLecturer: any = { role: [], serviceType: [] };
  cSaveLecturer: any = false;
  openDialogLecturer: boolean = false;

  UsersValueLecturer(action, Users: any = null) {
    if (action === 'delete') {
      if (confirm('Are you sure to delete?')) {
        this.dbService.RemoveUsersSeting(Users).subscribe((rs: any) => {
          this.loadDataLecturer();
          this._oderby();
        });
      }
    } else if (action === 'open') {
      this.vlUsersLecturer = {
        role: [{ name: 'Admin', code: 'Admin' }],
      };
      this.cSaveLecturer = false;
      this.openDialogLecturer = true;
    } else if (action === 'add') {
      let temp = _.cloneDeep(this.vlUsersLecturer);
      temp.nation = this.user.nation;
      this.dbService.AddUsersSeting(temp).subscribe((rs: any) => {
        if (rs) {
          this.dbService.GetUsersSeting(this.user.nation).subscribe((rs: any) => {
            this.lsUsers = rs;
            this.loadDataLecturer();
            this._oderby();
          });
          this.vlUsersLecturer = { role: [] };
          this.openDialogLecturer = false;
        }
      });
    } else if (action === 'edit') {
      let object = Users;
      this.vlUsersLecturer = object;
      this.cSaveLecturer = true;
      this.openDialogLecturer = true;
    } else {
      this.dbService.UpdateUsersSeting(Users).subscribe((rs: any) => {
        this.vlUsersLecturer = { role: [] };
        this.cSaveLecturer = false;
        this.openDialogLecturer = false;
        this.loadDataLecturer();
        this._oderby();
      });
    }
  }

  lsTempLecturerEmail: any = [];
  popupInputContentEmailLecturer: boolean = false;

  SendEmailLecturer() {
    let tempObjectEmail =
      this.lsTemplateEmailStudent && this.lsTemplateEmailStudent.length ? this.lsTemplateEmailStudent[0] : {};
    this.OptionSendEmail = {
      template: tempObjectEmail._id || null,
      type: tempObjectEmail.types || null,
      content: tempObjectEmail.content || null,
    };
    this.lsTempNoEmail = [];
    this.lsTempLecturerEmail = this.gridViewLecturer.filter((x) => x.selected);
    if (this.lsTempLecturerEmail.length) {
      let tempNoEmail = this.lsTempLecturerEmail.filter((x) => !x.email);
      if (tempNoEmail.length) {
        tempNoEmail.forEach((x) => {
          this.lsTempNoEmail.push({
            status: 'No Email',
            usercode: x.usercode,
            fullname: x.fullname,
          });
        });
        this.pupupNoEmail = true;
      } else {
        this.popupInputContentEmailLecturer = true;
        this.isSendEmailLecturer = false;
      }
    } else alert('Please, Selete a Lecturer');
  }

  SubjectLecturer: any = '';
  pushListDoneLecturerEmail: any = [];
  isSendEmailLecturer: boolean = false;

  SubmitSendEmailLecturer() {
    if (this.SubjectLecturer) {
      this.isSendEmailLecturer = true;
      this.value = 0;
      this.lsTempLecturerEmail.forEach((items, i) => {
        setTimeout(() => {
          let text = _.cloneDeep(this.OptionSendEmail.content);
          text = text.replace('[#UserCode#]', items.usercode || '');
          text = text.replace('[#FullName#]', items.fullname || '');
          text = text.replace('[#UserCompany#]', items.email || '');
          text = text.replace('[#UserEmail#]', items.company || '');
          text = text.replace('[#UserCourse#]', items.course || '');
          text = text.replace('[#UserClass#]', items.class || '');
          text = text.replace('[#UserDepartment#]', items.department || '');
          var status: any = null;
          if (this.OptionSendEmail.type === 'reset') {
            status = this.submitForgotPassword(items.email, this.user.nation, this.SubjectLecturer, text);
          } else {
            this.SendEmail(items.email, this.SubjectLecturer, text);
            status = true;
          }
          this.pushListDoneLecturerEmail.push({
            isUpdateDone: status,
            usercode: items.usercode,
            fullname: items.fullname,
          });
          this.value = Math.ceil((this.pushListDoneLecturerEmail.length * 100) / this.lsTempLecturerEmail.length);
        }, i * 20000);
      });
    } else alert('Please, Enter Subject!');
  }

  // ========================================================================
  _oderby() {
    this.lsUsers = _.orderBy(this.lsUsers, 'username', 'asc');
  }
  AllEmails: any = [];
  reloadInfoUser() {
    this.AllEmails = [];
    this.lsUsers.forEach((x) => {
      let tempcompany = this.listCompany?.find((n) => n._id === x.companyId);
      if (tempcompany) x.company = tempcompany.name;
      else x.company = '';

      let tempcourse = this.listCourse?.find((n) => n._id === x.courseId);
      if (tempcourse) x.course = tempcourse.name;
      else x.course = '';
      if (x.email && x.activeLicenseType === 'Licensed') {
        this.AllEmails.push(x.email);
      }
      // let tempclass = this.listClass.find(n => n._id === x.classId);
      // if (tempclass) x.class = tempclass.name;
      // else x.class = ''

      // let tempdepartment = this.listDepartment.find(n => n._id === x.departmentId);
      // if (tempdepartment) x.department = tempdepartment.name;
      // else x.department = ''
    });
  }
  showAllEmails: boolean = false;

  copyEmailsToClipboard(): void {
    if (this.AllEmails?.length > 0) {
      const emailText = this.AllEmails.join('; ');
      navigator.clipboard
        .writeText(emailText)
        .then(() => {
          this.notifi('success', `${this.AllEmails.length} emails copied to clipboard!`);
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = emailText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          this.notifi('success', `${this.AllEmails.length} emails copied to clipboard!`);
        });
    }
  }

  exportEmails(): void {
    if (this.AllEmails?.length > 0) {
      const emailText = this.AllEmails.join('\n');
      const blob = new Blob([emailText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected-emails-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.notifi('success', `${this.AllEmails.length} emails exported successfully!`);
    }
  }

  removeEmail(index: number): void {
    if (this.AllEmails && index >= 0 && index < this.AllEmails.length) {
      this.AllEmails.splice(index, 1);
      this.notifi('info', 'Email removed from selection');
    }
  }

  toggleEmailView(): void {
    this.showAllEmails = !this.showAllEmails;
  }

  trackByEmail(index: number, email: string): string {
    return email;
  }
  bookingTabSelected: any;
  NameTab: any;
  private _menuLeft: any = [
    // Booking
    {
      id: '0',
      name: 'Users',
      hasChild: true,
      selected: true,
      expanded: true,
      show: true,
      icon: 'bi bi-person-bounding-box',
    },
    // { id: "8", name: 'User Group', hasChild: true, selected: false, expanded: true, show: true, icon: 'folder' },
    // { id: "5", name: 'Admin', hasChild: true, selected: false, expanded: true, show: true, icon: 'folder' },
    // { id: "6", name: 'Setting', hasChild: true, selected: false, expanded: true, show: true, icon: 'bi bi-gear' },
    { id: '1', name: 'Company', selected: false, show: true, icon: 'bi bi-diagram-2-fill' },
    { id: '2', name: 'Group User', selected: false, show: true, icon: 'bi bi-person-lines-fill' },
    // { id: "3", pid: "6", name: 'Class', selected: false, show: true, icon: 'folder' },
    // { id: "4", pid: "6", name: 'Department/Group', selected: false, show: true, icon: 'folder' },
    { id: '7', name: 'Template Email', selected: false, show: true, icon: 'bi bi-card-checklist' },
    // { id: '10', name: 'License Management', selected: false, show: true, icon: 'bi bi-card-checklist' },
  ];
  public get menuLeft(): any {
    return this._menuLeft;
  }

  public set menuLeft(value: any) {
    this._menuLeft = value;
  }

  menuLeftObj = this.menuLeft.reduce((a, b) => {
    a[b.id] = b;
    a[b.name] = b;
    return a;
  }, {});
  field: Object = {
    dataSource: [],
    id: 'id',
    parentID: 'pid',
    text: 'name',
    hasChildren: 'hasChild',
    selected: 'selected',
    iconCss: 'icon',
  };

  onNodeSelecting(args) {
    this.menuLeft.forEach((mn: any) => (mn.selected = false));
    let temp = this.menuLeft.find((x) => x.id == args.nodeData.id);
    if (temp.id == '6') {
      this.menuLeft.forEach((mn: any) => (mn.selected = false));
      let obj1 = this.menuLeft.find((x) => x.id == '1');
      obj1.selected = true;
      this.NameTab = obj1.name;
    } else {
      temp.selected = true;
      this.bookingTabSelected = temp;
      this.NameTab = temp.name;
      switch (temp.id) {
        case '0':
          this.loadDataStudent();
          break;
        case '8':
          this.loadDataStudent();
          break;
        case '5':
          this.loadDataLecturer();
          break;
      }
    }
  }

  lsExchangeRateGroup: any = [];

  initExchangeRateGroup() {
    this.dbService.getExchangeRates(this.user.nation, true).subscribe((lsExchangeRate) => {
      lsExchangeRate = lsExchangeRate || [];
      this.lsExchangeRateGroup = this.getExchangeRateGroup(lsExchangeRate);
    });
  }

  getExchangeRateGroup(lsExchangeRate) {
    lsExchangeRate.forEach((x) => {
      x.groupId = x.groupId || null;
      x.groupName = x.groupId ? x.groupName : 'Default';
    });

    let groups = _.chain(lsExchangeRate)
      .groupBy('groupId')
      .map((x) => {
        return {
          groupId: x[0].groupId,
          groupName: x[0].groupName,
        };
      })
      .value();

    return groups;
  }

  SelectTemplateStudent(vl) {
    let temp = this.lsTemplateEmailStudent.find((x) => x._id == vl);
    this.OptionSendEmail.type = temp?.types;
    this.OptionSendEmail.content = temp?.content;
  }

  async submitForgotPassword(email, nation, Subject, content) {
    if (email && nation) {
      try {
        let [rs] = await Promise.all([this.dbService.CheckEmailUser(email, nation).toPromise()]);
        if (rs) {
          let object = $.parseJSON(Base64.decode(rs));
          if (object.success) {
            content = content.replace('[#UserName#]', object.user || '');
            content = content.replace('[#Password#]', object.pass || '');
            this.SendEmail(email, Subject, content);
            return true;
          } else return false;
        }
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  revoke2FA(vlUsers) {
    vlUsers.twoFAGoogle = false;
    this.UsersValue('update', vlUsers);
  }

  SendEmail(email, Subject, content) {
    var Emails = [
      {
        Email: email,
        Subject: Subject,
        Content: content,
      },
    ];
    this.dbService.notifyApiUrl(Emails).subscribe((rs) => {});
  }

  public min: number = 0;
  public value: number = 0;
  public max: number = 100;
  public ticks: Object = { placement: 'After', largeStep: 10, smallStep: 10, showSmallTicks: true };
  public tooltip: Object = { placement: 'Before', isVisible: true, showOn: 'Always' };

  // Check if user has accounting-related roles
  hasAccountingRoles(): boolean {
    if (!this.vlUsers.role || !Array.isArray(this.vlUsers.role)) {
      return false;
    }

    const hasAccountingRole = this.vlUsers.role.some(
      (role) => role.code === 'Accounting' || role.name === 'Accounting'
    );

    const hasAccountingManagerRole = this.vlUsers.role.some(
      (role) => role.code === 'AccountingManager' || role.name === 'Accounting Manager'
    );
    return hasAccountingRole || hasAccountingManagerRole;
  }
  // Role management functions
  // Sửa lại function isRoleSelected để kiểm tra theo code
  isRoleSelected(role: any): boolean {
    if (!this.vlUsers.role || !Array.isArray(this.vlUsers.role)) {
      return false;
    }

    // Check if role is selected by comparing role code
    return this.vlUsers.role.some((selectedRole) => {
      return selectedRole.code === role.code;
    });
  }

  // Sửa lại function onRoleChange để lưu theo code
  onRoleChange(role: any, event: any): void {
    if (!this.vlUsers.role) {
      this.vlUsers.role = [];
    }

    if (event.checked) {
      // Add role if checked - kiểm tra theo code để tránh duplicate
      const existingRole = this.vlUsers.role.find((r) => {
        if (typeof r === 'string') {
          return r === role.code || r === role.name;
        }
        return r.code === role.code || r.name === role.name;
      });

      if (!existingRole) {
        this.vlUsers.role.push({
          name: role.name,
          code: role.code,
        });
      }
    } else {
      // Remove role if unchecked - xóa theo code
      this.vlUsers.role = this.vlUsers.role.filter((r) => {
        if (typeof r === 'string') {
          return r !== role.code && r !== role.name;
        }
        return r.code !== role.code && r.name !== role.name;
      });
    }
  }

  // Country/Nation management functions
  // Sửa lại function onCountryChange để vlUsers.nation là array string
  onCountryChange(country: any, event: any): void {
    if (!this.vlUsers.multiNation) {
      this.vlUsers.multiNation = [];
    }

    if (event.checked) {
      // Add country code if checked
      if (!this.vlUsers.multiNation.includes(country.nation)) {
        this.vlUsers.multiNation.push(country.nation);
      }
    } else {
      // Remove country code if unchecked
      this.vlUsers.multiNation = this.vlUsers.multiNation.filter((c) => c !== country.nation);
    }
  }

  // Sửa lại function isCountrySelected để phù hợp với array string
  isCountrySelected(country: any): boolean {
    if (!this.vlUsers.multiNation || !Array.isArray(this.vlUsers.multiNation)) {
      return false;
    }

    return this.vlUsers.multiNation.includes(country.nation);
  }

  // Company License Statistics Methods
  generateCompanyLicenseStatistics(): void {
    if (!this.listCompany || !this.lsUsers) {
      return;
    }

    // First, get statistics for all companies
    const companyStats = this.listCompany.map((company: any) => {
      const companyUsers = this.lsUsers.filter((user: any) => user.companyId === company._id);
      
      const usersWithLicense = companyUsers.filter((user: any) => 
        user.hasActiveLicense || user.activeLicenseType && user.activeLicenseType !== 'No License'
      );
      
      const usersWithoutLicense = companyUsers.filter((user: any) => 
        !user.hasActiveLicense && (!user.activeLicenseType || user.activeLicenseType === 'No License')
      );

      const activeLicenses = companyUsers.filter((user: any) => user.hasActiveLicense).length;
      const expiredLicenses = companyUsers.filter((user: any) => 
        user.activeLicenseType === 'Expired'
      ).length;

      return {
        companyId: company._id,
        companyName: company.name,
        totalUsers: companyUsers.length,
        usersWithLicense: usersWithLicense.length,
        usersWithoutLicense: usersWithoutLicense.length,
        activeLicenses: activeLicenses,
        expiredLicenses: expiredLicenses,
        licenseUtilization: companyUsers.length > 0 ? 
          Math.round((usersWithLicense.length / companyUsers.length) * 100) : 0,
        users: companyUsers
      };
    }).filter(stat => stat.totalUsers > 0);

    // Get users without company assignment
    const usersWithoutCompany = this.lsUsers.filter((user: any) => 
      !user.companyId || user.companyId === null || user.companyId === ''
    );

    // Add statistics for unassigned users if any exist
    if (usersWithoutCompany.length > 0) {
      const usersWithLicense = usersWithoutCompany.filter((user: any) => 
        user.hasActiveLicense || user.activeLicenseType && user.activeLicenseType !== 'No License'
      );
      
      const usersWithoutLicense = usersWithoutCompany.filter((user: any) => 
        !user.hasActiveLicense && (!user.activeLicenseType || user.activeLicenseType === 'No License')
      );

      const activeLicenses = usersWithoutCompany.filter((user: any) => user.hasActiveLicense).length;
      const expiredLicenses = usersWithoutCompany.filter((user: any) => 
        user.activeLicenseType === 'Expired'
      ).length;

      const unassignedStats = {
        companyId: 'unassigned',
        companyName: 'Unassigned Users',
        totalUsers: usersWithoutCompany.length,
        usersWithLicense: usersWithLicense.length,
        usersWithoutLicense: usersWithoutLicense.length,
        activeLicenses: activeLicenses,
        expiredLicenses: expiredLicenses,
        licenseUtilization: usersWithoutCompany.length > 0 ? 
          Math.round((usersWithLicense.length / usersWithoutCompany.length) * 100) : 0,
        users: usersWithoutCompany,
        isUnassigned: true // Flag to identify unassigned group
      };

      companyStats.push(unassignedStats);
    }

    this.companyLicenseStats = companyStats;
  }

  toggleLicenseStats(): void {
    this.showLicenseStats = !this.showLicenseStats;
    if (this.showLicenseStats) {
      this.generateCompanyLicenseStatistics();
    }
  }

  exportLicenseStats(): void {
    const dataToExport = this.getFilteredCompanyStats();
    if (dataToExport.length === 0) {
      this.notifi('warning', 'No data to export');
      return;
    }

    const csvData = dataToExport.map(stat => ({
      'Company': stat.companyName,
      'Total Users': stat.totalUsers,
      'Users with License': stat.usersWithLicense,
      'Users without License': stat.usersWithoutLicense,
      'Active Licenses': stat.activeLicenses,
      'Expired Licenses': stat.expiredLicenses,
      'License Utilization (%)': stat.licenseUtilization,
      'Status': this.getUtilizationStatus(stat.licenseUtilization)
    }));

    const csvContent = this.convertToCSV(csvData);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    this.downloadCSV(csvContent, `company-license-statistics-${timestamp}.csv`);
    this.notifi('success', `Exported ${dataToExport.length} companies to CSV`);
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    return headers + '\n' + rows;
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Helper methods for license statistics
  getCompanyColor(utilization: number): string {
    if (utilization >= 80) return '#28a745'; // Green
    if (utilization >= 60) return '#17a2b8'; // Blue
    if (utilization >= 40) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  }

  getUtilizationStatus(utilization: number): string {
    if (utilization >= 80) return 'Excellent';
    if (utilization >= 60) return 'Good';
    if (utilization >= 40) return 'Fair';
    return 'Poor';
  }

  trackByCompanyId(index: number, item: any): any {
    return item.companyId || 'unassigned';
  }

  getTotalUsers(): number {
    return this.companyLicenseStats.reduce((total, stat) => total + stat.totalUsers, 0);
  }

  getOverallUtilization(): number {
    const totalUsers = this.getTotalUsers();
    const totalWithLicense = this.companyLicenseStats.reduce((total, stat) => total + stat.usersWithLicense, 0);
    return totalUsers > 0 ? Math.round((totalWithLicense / totalUsers) * 100) : 0;
  }

  // Search and sort functionality for statistics
  getFilteredCompanyStats(): any[] {
    let filtered = this.companyLicenseStats;

    // Apply search filter
    if (this.statsSearchText && this.statsSearchText.trim()) {
      const searchTerm = this.statsSearchText.toLowerCase().trim();
      filtered = filtered.filter(stat => 
        stat.companyName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA = a[this.statsSortBy];
      let valueB = b[this.statsSortBy];

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (this.statsSortDirection === 'asc') {
        return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
      } else {
        return valueA < valueB ? 1 : (valueA > valueB ? -1 : 0);
      }
    });

    return filtered;
  }

  sortStats(column: string): void {
    if (this.statsSortBy === column) {
      this.statsSortDirection = this.statsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.statsSortBy = column;
      this.statsSortDirection = 'asc';
    }
  }

  clearStatsSearch(): void {
    this.statsSearchText = '';
  }

  getFilteredTotalUsers(): number {
    const filtered = this.getFilteredCompanyStats();
    return filtered.reduce((total, stat) => total + stat.totalUsers, 0);
  }

  getFilteredAverageUtilization(): number {
    const filtered = this.getFilteredCompanyStats();
    if (filtered.length === 0) return 0;
    
    const totalUtilization = filtered.reduce((total, stat) => total + stat.licenseUtilization, 0);
    return Math.round(totalUtilization / filtered.length);
  }

  hasUnassignedUsers(): boolean {
    return this.companyLicenseStats.some(stat => stat.isUnassigned === true);
  }
  // Group (Course) Statistics for Student Grid
  getGroupStatistics(): any[] {
    if (!this.listCourse || !this.lsDataStudent) return [];
    // Group by course name
    const groupStats = this.listCourse.map((course: any) => {
      const groupUsers = this.lsDataStudent.filter((user: any) => user.course === course.name);
      const usersWithLicense = groupUsers.filter((user: any) => user.hasActiveLicense || (user.activeLicenseType && user.activeLicenseType !== 'No License'));
      const usersWithoutLicense = groupUsers.filter((user: any) => !user.hasActiveLicense && (!user.activeLicenseType || user.activeLicenseType === 'No License'));
      return {
        groupName: course.name,
        totalUsers: groupUsers.length,
        usersWithLicense: usersWithLicense.length,
        usersWithoutLicense: usersWithoutLicense.length,
        utilization: groupUsers.length > 0 ? Math.round((usersWithLicense.length / groupUsers.length) * 100) : 0
      };
    }).filter(stat => stat.totalUsers > 0);
    // Users with no group
    const usersNoGroup = this.lsDataStudent.filter((user: any) => !user.course || user.course === '');
    if (usersNoGroup.length > 0) {
      const usersWithLicense = usersNoGroup.filter((user: any) => user.hasActiveLicense || (user.activeLicenseType && user.activeLicenseType !== 'No License'));
      const usersWithoutLicense = usersNoGroup.filter((user: any) => !user.hasActiveLicense && (!user.activeLicenseType || user.activeLicenseType === 'No License'));
      groupStats.push({
        groupName: 'Unassigned',
        totalUsers: usersNoGroup.length,
        usersWithLicense: usersWithLicense.length,
        usersWithoutLicense: usersWithoutLicense.length,
        utilization: Math.round((usersWithLicense.length / usersNoGroup.length) * 100)
      });
    }
    return groupStats;
  }

  getGroupColor(utilization: number): string {
    if (utilization >= 80) return '#28a745'; // Green
    if (utilization >= 60) return '#17a2b8'; // Blue
    if (utilization >= 40) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  }
}
