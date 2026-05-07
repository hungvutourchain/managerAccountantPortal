import {
  NgModule,
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
} from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationRoutes } from "./configuration-routing.module";
import { RouterModule } from "@angular/router";
import { AppFactory } from "app/shared/lib/common.service";

import { AiTrainingComponent } from "./ai-training/ai-training.component";
import { DeepseekTrainingService } from "./ai-training/deepseek-training.service";
import { AiPromptConfigComponent } from "./ai-prompt-config/ai-prompt-config.component";
import { AiPromptConfigService } from "./ai-prompt-config/ai-prompt-config.service";
import { AiManagementComponent } from "./ai-management/ai-management.component";

import { TariffUsersComponent } from "./tariff_users/tariff-users.component";
import { ImagesComponent } from "./SyncImages/SyncImages.component";
import { OutgoingMailboxComponent } from "./outgoing_mailbox/outgoing_mailbox.component";
import { OnlineUsersComponent } from './OnlineUsersComponent/online-users.component';
import { SharedModule } from "app/shared/shared.module";
import { TabModule, TabAllModule, AccordionModule } from '@syncfusion/ej2-angular-navigations';
import { SpreadsheetAllModule } from '@syncfusion/ej2-angular-spreadsheet';
import { CheckBoxModule, ButtonModule, SwitchModule } from "@syncfusion/ej2-angular-buttons";
import {
  DropDownListModule,
  ListBoxAllModule,
} from "@syncfusion/ej2-angular-dropdowns";
import { DialogModule } from "@syncfusion/ej2-angular-popups";
import { GridAllModule } from "@syncfusion/ej2-angular-grids";
import {
  ToolbarModule,
  MenuModule,
  TreeViewModule,
} from "@syncfusion/ej2-angular-navigations";
import {
  TextBoxModule,
  NumericTextBoxModule,
  MaskedTextBoxModule,
} from "@syncfusion/ej2-angular-inputs";
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
@NgModule({
  declarations: [
    OutgoingMailboxComponent,
    AiTrainingComponent,
    TariffUsersComponent,
    ImagesComponent,
    OnlineUsersComponent,
    AiPromptConfigComponent,
    AiManagementComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(ConfigurationRoutes),
    TabModule, TabAllModule, AccordionModule,
    DropDownListModule,
    CheckBoxModule,
    GridAllModule,
    ListBoxAllModule,
    DialogModule,
    TextBoxModule,
    NumericTextBoxModule,
    ButtonModule,
    ToolbarModule,
    MenuModule,
    SpreadsheetAllModule,
    TreeViewModule,
    MaskedTextBoxModule,
    SwitchModule,
    DatePickerModule,
  ],
  providers: [AppFactory, DeepseekTrainingService, AiPromptConfigService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class ConfigurationModule { }
