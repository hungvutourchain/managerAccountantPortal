import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppFactory } from 'app/shared/lib/common.service';
import { MainPageRoutes } from 'app/modules/admin/MainPage/MainPage-routing.module';
import { SpreadsheetAllModule } from '@syncfusion/ej2-angular-spreadsheet';
import { SharedModule } from 'app/shared/shared.module';
import { TabAllModule } from '@syncfusion/ej2-angular-navigations';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { TextBoxModule, NumericTextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { CheckBoxModule, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { GridAllModule } from '@syncfusion/ej2-angular-grids';
import { RichTextEditorAllModule } from "@syncfusion/ej2-angular-richtexteditor";
import { MainPageComponent } from './main-page.component';
import { MainPageDashboardComponent } from './main-page-dashboard.component';
import { MainPagePanelManagerComponent } from './main-page-panel-manager.component';
import { CustomerManagementComponent } from './customer-management.component';
import { DebtManagementComponent } from './debt-management.component';
import { ReportCenterComponent } from './report-center.component';
import { CustomerManagementService } from './customer-management.service';
import { TransactionManagementService } from './transaction-management.service';
import { PageLoadingService } from './page-loading.service';

@NgModule({
  declarations: [
    MainPageComponent,
    MainPageDashboardComponent,
    MainPagePanelManagerComponent,
    CustomerManagementComponent,
    DebtManagementComponent,
    ReportCenterComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(MainPageRoutes),
    MatTooltipModule,
    SharedModule,
    SpreadsheetAllModule,
    RichTextEditorAllModule,
    TabAllModule, TextBoxModule,
    DropDownListModule, DatePickerModule,
    NumericTextBoxModule, CheckBoxModule, SwitchModule,
    DialogModule, GridAllModule
  ],
  exports: [
    
  ],
  providers: [
    AppFactory,
    CustomerManagementService,
    TransactionManagementService,
    PageLoadingService,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class MainPageModule { }
