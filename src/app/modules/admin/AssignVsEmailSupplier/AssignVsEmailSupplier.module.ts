import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppFactory } from 'app/shared/lib/common.service';
import { AssignVsEmailSupplierRoutes } from 'app/modules/admin/AssignVsEmailSupplier/AssignVsEmailSupplier-routing.module';
import { SpreadsheetAllModule } from '@syncfusion/ej2-angular-spreadsheet';
import { SharedModule } from 'app/shared/shared.module';
import { TabAllModule } from '@syncfusion/ej2-angular-navigations';
import { TextBoxModule, NumericTextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { CheckBoxModule, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { AssignVsEmailSupplierListComponent } from './list/list.component';
import { AssignVsEmailSupplierDetailComponent } from './detail/detail.component';
import { GridAllModule } from '@syncfusion/ej2-angular-grids';
import { SendEmailTaskNewComponent } from './SendEmailTaskNew/SendEmailTaskNew.component';
import { RichTextEditorAllModule } from "@syncfusion/ej2-angular-richtexteditor";
import { ViewLsAssignedServiceComponent } from './detail/ViewLsAssignedService';
@NgModule({
  declarations: [
    AssignVsEmailSupplierListComponent,
    AssignVsEmailSupplierDetailComponent,
    ViewLsAssignedServiceComponent,
    SendEmailTaskNewComponent
  ],
  imports: [
    RouterModule.forChild(AssignVsEmailSupplierRoutes),
    SharedModule,
    SpreadsheetAllModule,
    RichTextEditorAllModule,
    TabAllModule, TextBoxModule,
    NumericTextBoxModule, CheckBoxModule, SwitchModule,
    DialogModule, GridAllModule
  ],
   exports: [
    SendEmailTaskNewComponent // Export here
  ],
  providers: [
    AppFactory
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class AssignVsEmailSupplierModule { }
