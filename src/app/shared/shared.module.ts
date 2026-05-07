import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DemoMaterialModule } from './material-module';

import { MatFormFieldModule } from '@angular/material/form-field';
import { GridModule, ExcelExportService, PageService, SortService, FilterService } from '@syncfusion/ej2-angular-grids';

import { DialogModule, TooltipModule } from '@syncfusion/ej2-angular-popups';
// import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ToastModule } from '@syncfusion/ej2-angular-notifications';
import { DbService } from './connectData/db.service';
import { LibService } from './lib/lib.service';
// directive
import { AfterValueChangedDirective } from './directive/delay.service';

import { SafeHtmlPipe } from './pipe/safe-html.pipe';
import { FilterPipe } from './pipes/filter.pipe';
import { FilterExpirationByDaysPipe } from './pipes/filter-expiration-by-days.pipe';
import { CountPipe } from './pipes/count.pipe';
// component
import { ScheduleModule } from '@syncfusion/ej2-angular-schedule';
import { EditerSyncfusionOrginComponent } from './components/editerSyncfusion/editerSyncfusion.component';
import { EditerSyncfusionCrooperComponent } from './components/editerSyncfusionCrooper/editerSyncfusion.component';
import { CrooperImageComponent } from './components/crooperImage/crooperImage.component';
import { ProfileComponent } from './components/profile/profile.component';

import { SpeechComponent } from './components/speech/speech.component';
import { AIAssistViewModule } from '@syncfusion/ej2-angular-interactive-chat';
import { TabModule } from '@syncfusion/ej2-angular-navigations';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
import { SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { ButtonModule, SpeedDialModule } from '@syncfusion/ej2-angular-buttons';
import { InPlaceEditorModule } from '@syncfusion/ej2-angular-inplace-editor';
import { DropDownListModule, MultiSelectAllModule } from '@syncfusion/ej2-angular-dropdowns';
import { TextBoxModule, ColorPickerModule, OtpInputModule } from '@syncfusion/ej2-angular-inputs';
import { NumericTextBoxModule, MaskedTextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { RadioButtonModule } from '@syncfusion/ej2-angular-buttons';
import { CheckBoxModule } from '@syncfusion/ej2-angular-buttons';
import { BlockEditorModule } from '@syncfusion/ej2-angular-blockeditor';
import { FileManagerAllModule } from '@syncfusion/ej2-angular-filemanager';
import { SliderModule } from '@syncfusion/ej2-angular-inputs';
import { AngularPinturaModule } from '@pqina/angular-pintura';
import { CKEditorModule } from 'ckeditor4-angular';
import { SkeletonModule } from '@syncfusion/ej2-angular-notifications';
import { FabModule } from '@syncfusion/ej2-angular-buttons';
import {
  DatePickerAllModule,
  DatePickerModule,
  DateTimePickerModule,
  TimePickerModule,
} from '@syncfusion/ej2-angular-calendars';
import { DocumentEditorAllModule, DocumentEditorContainerAllModule } from '@syncfusion/ej2-angular-documenteditor';
import { AppFactory } from 'app/shared/lib/common.service';
import { ToolbarModule, MenuModule, TreeViewModule } from '@syncfusion/ej2-angular-navigations';
import { UploadFileComponent } from './components/UploadFile/UploadFile.component';

@NgModule({
  declarations: [
    AfterValueChangedDirective,
    SafeHtmlPipe,
    FilterPipe,
    FilterExpirationByDaysPipe,
    CountPipe,
    EditerSyncfusionOrginComponent,
    EditerSyncfusionCrooperComponent,
    CrooperImageComponent,
    UploadFileComponent,
    ProfileComponent,
    SpeechComponent,
  ],
  imports: [
    DatePickerAllModule,
    DatePickerModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    GridModule,
    DialogModule,
    TooltipModule,
    ToastModule,
    DemoMaterialModule,
    ScheduleModule,
    // NgbModule,
    TabModule,
    RichTextEditorAllModule,
    SwitchModule,
    ButtonModule,
    SpeedDialModule,
    DropDownListModule,
    MultiSelectAllModule,
    TextBoxModule,
    ColorPickerModule,
    OtpInputModule,
    NumericTextBoxModule,
    MaskedTextBoxModule,
    RadioButtonModule,
    InPlaceEditorModule,
    CheckBoxModule,
    BlockEditorModule,
    FileManagerAllModule,
    CKEditorModule,
    FabModule,
    SkeletonModule,
    SliderModule,
    AngularPinturaModule,
    TreeViewModule,
    ToolbarModule,
    MenuModule,
    DatePickerModule,
    DateTimePickerModule,
    TimePickerModule,
    DocumentEditorAllModule,
    DocumentEditorContainerAllModule,
    AIAssistViewModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    InPlaceEditorModule,
    ReactiveFormsModule,
    DropDownListModule,
    MatFormFieldModule,
    GridModule,
    DialogModule,
    DialogModule,
    TooltipModule,
    DemoMaterialModule,
    ColorPickerModule,
    OtpInputModule,
    ScheduleModule,
    RadioButtonModule,
    AfterValueChangedDirective,
    SkeletonModule,
    AngularPinturaModule,
    SafeHtmlPipe,
    FilterPipe,
    FilterExpirationByDaysPipe,
    CountPipe,
    MultiSelectAllModule,
    CKEditorModule,
    EditerSyncfusionOrginComponent,
    EditerSyncfusionCrooperComponent,
    CrooperImageComponent,
    UploadFileComponent,
    ProfileComponent,
    DatePickerModule,
    DateTimePickerModule,
    TimePickerModule,
    BlockEditorModule,
    DocumentEditorAllModule,
    DocumentEditorContainerAllModule,
    SwitchModule,
    ToolbarModule,
    MenuModule,
    SpeedDialModule,
    TreeViewModule,
    SpeechComponent,
  ],
  providers: [
    DbService,
    LibService,
    AppFactory,
    CurrencyPipe, // for AppFactory
    DatePipe,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class SharedModule {}
