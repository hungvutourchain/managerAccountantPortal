import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-form-submit-dialog',
  template: `
    <div class="form-submit-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
         Submit Form
        </h2>
        <button mat-icon-button class="close-button" (click)="closeDialog()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <!-- REMOVED: app-form-submit component not found -->
        <!-- <app-form-submit
          [title]="''"
          [submitButtonText]="'Submit'"
          [resetButtonText]="'Clear Form'"
          [isLoading]="isSubmitting"
          [disabled]="false"
          [formData]="initialData"
          [availableLabels]="mockLabels"
          [availableGroups]="mockGroups"
          [showLabels]="true"
          [showGroups]="true"
          [showNotes]="true"
          [showCustomerInfo]="true"
          [showTourInfo]="true"
          (formSubmit)="onFormSubmit($event)"
          (formReset)="onFormReset()"
          (formChange)="onFormChange($event)">
        </app-form-submit> -->
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .form-submit-dialog {
      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 32px;
        border-bottom: 1px solid #e0e6ed;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        color: #212529;
        margin: -24px -24px 0 -24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

        h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #212529;
          letter-spacing: -0.5px;

          .header-icon {
            font-size: 26px;
            width: 26px;
            height: 26px;
            color: #495057;
          }
        }

        .close-button {
          color: #6c757d;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          transition: all 0.3s ease;

          &:hover {
            background-color: rgba(108, 117, 125, 0.1);
            color: #495057;
            transform: scale(1.05);
          }

          mat-icon {
            font-size: 20px;
          }
        }
      }

      .dialog-content {
        padding: 32px 32px 24px 32px;
        max-height: 80vh;
        overflow-y: auto;
        background: #ffffff;

        ::ng-deep app-form-submit {
          .form-submit-container {
            box-shadow: none;
            margin: 0;
            padding: 0;
            background: transparent;
          }

          .form-header {
            display: none;
          }

          .form-section {
            margin-bottom: 32px;
          }
        }
      }
    }

    ::ng-deep .form-submit-dialog-panel {
      .mat-mdc-dialog-container {
        max-width: 95vw;
        max-height: 95vh;
        width: 1200px;
      }
    }
  `],
  standalone: false,
})
export class FormSubmitDialogComponent implements OnInit {
  isSubmitting = false;

  initialData = {
    numberOfAdult: 1,
    numberOfChild: 0,
    numberOfInfants: 0
  };

  mockLabels = [
    { id: 1, title: 'VIP Customer', color: '#ff9800' },
    { id: 2, title: 'Priority Booking', color: '#f44336' },
    { id: 3, title: 'Corporate Client', color: '#2196f3' },
    { id: 4, title: 'Repeat Customer', color: '#4caf50' },
    { id: 5, title: 'VNIN - B2C', color: '#9c27b0' },
    { id: 6, title: 'New Task', color: '#795548' }
  ];

  mockGroups = [
    { name: 'Group-HCM' },
    { name: 'Group-Hanoi' },
    { name: 'Group-DaNang' },
    { name: 'Group-VIP' },
    { name: 'Group-Sales' }
  ];

  constructor(
    public dialogRef: MatDialogRef<FormSubmitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('Form Submit Dialog initialized');
    
    // Merge any passed data with initial data
    if (this.data) {
      this.initialData = { ...this.initialData, ...this.data };
    }
  }

  onFormSubmit(formData: any): void {
    console.log('Form submitted from dialog:', formData);
    
    this.isSubmitting = true;

    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      
      // Show success message
      this.snackBar.open('Lead created successfully!', 'Close', {
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
        panelClass: 'success-snackbar'
      });

      // Close dialog with the form data
      this.dialogRef.close({
        success: true,
        data: formData
      });
    }, 2000);

    // Here you would typically call your API service
    // this.leadService.createLead(formData).subscribe(...)
  }

  onFormReset(): void {
    console.log('Form reset in dialog');
    this.snackBar.open('Form has been reset', 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: 'info-snackbar'
    });
  }

  onFormChange(formData: any): void {
    // Handle real-time form changes if needed
    console.log('Form data changed in dialog:', formData);
  }

  closeDialog(): void {
    this.dialogRef.close({
      success: false,
      data: null
    });
  }
}
