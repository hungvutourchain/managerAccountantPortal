import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppFactory } from 'app/shared/lib/common.service';
import { MainPageRoutes } from 'app/modules/admin/MainPage/MainPage-routing.module';
import { SpreadsheetAllModule } from '@syncfusion/ej2-angular-spreadsheet';
import { SharedModule } from 'app/shared/shared.module';
import { TabAllModule } from '@syncfusion/ej2-angular-navigations';
import { TextBoxModule, NumericTextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { CheckBoxModule, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { GridAllModule } from '@syncfusion/ej2-angular-grids';
import { RichTextEditorAllModule } from "@syncfusion/ej2-angular-richtexteditor";
import { MainPageComponent } from './main-page.component';
import { MainPageDashboardComponent } from './main-page-dashboard.component';
import { MainPagePanelManagerComponent } from './main-page-panel-manager.component';

@NgModule({
  declarations: [
    MainPageComponent,
    MainPageDashboardComponent,
    MainPagePanelManagerComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(MainPageRoutes),
    SharedModule,
    SpreadsheetAllModule,
    RichTextEditorAllModule,
    TabAllModule, TextBoxModule,
    NumericTextBoxModule, CheckBoxModule, SwitchModule,
    DialogModule, GridAllModule
  ],
  exports: [
    
  ],
  providers: [
    AppFactory
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class MainPageModule { }
