import { Component, Input, ViewEncapsulation, ViewChild, EventEmitter, Output } from '@angular/core';
import {
  RichTextEditorComponent, ToolbarService,
  LinkService, ImageService, HtmlEditorService, TableService, ToolbarSettingsModel,
  FileManagerSettingsModel, FileManagerService, QuickToolbarService
} from '@syncfusion/ej2-angular-richtexteditor';
import * as isglobals from 'app/globals';
import { environment as env } from 'environments/environment';
import * as _ from 'lodash';
import { LocalStorageService } from 'angular-web-storage';
import { DomSanitizer } from '@angular/platform-browser';
import { classNames } from '@syncfusion/ej2-angular-buttons';
@Component({  standalone: false,
  selector: 'editer-syncfusion-orgin',
  templateUrl: './editerSyncfusion.component.html',
  styleUrls: ['./editerSyncfusion.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ToolbarService, LinkService, ImageService, HtmlEditorService,
    TableService, QuickToolbarService, FileManagerService]
})
export class EditerSyncfusionOrginComponent {
  @Input() dateTimeFormat: string;
  @Input() str: string;
  @Input() disabled: boolean = false;
  @Input() height: number | string = 350;
  @Input() className: string = '';
  @Output() strChange = new EventEmitter<string>();
  public family: any
  private hostUrl: string = env.syncFileManagerLocal;
  public fileManagerSettings: FileManagerSettingsModel
  public filterSettings: any = {
    caseSensitive: false,
    operator: 'contains'
  };
  constructor(
    protected _sanitizer: DomSanitizer,
  ) {
    this.family = isglobals.familyFonts;
    this.fileManager()
  }
  public insertImageSettings = {
    display: "Block"
  };
  fileManager() {
    this.fileManagerSettings = {
      enable: true,
      path: '/Pictures/Food',
      ajaxSettings: {
        // url: this.hostUrl + 'api/GoogleDriveProvider/GoogleDriveFileOperations',
        // getImageUrl: this.hostUrl + 'api/GoogleDriveProvider/GoogleDriveGetImage'
        url: this.hostUrl + '/api/FileManager/FileOperations',
        getImageUrl: this.hostUrl + '/api/FileManager/GetImage',
        downloadUrl: this.hostUrl + '/api/FileManager/Download',
        uploadUrl: this.hostUrl + '/api/FileManager/Upload'
      }
    };
  }
  showckeditor: boolean = false
  ckeditConfig: any = {
    versionCheck: false,
    toolbar: [
      { name: 'document', items: ['Source', '-', 'Save', 'NewPage', 'ExportPdf', 'Preview', 'Print', '-', 'Templates'] },
      { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
      { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll', '-', 'Scayt'] },
      { name: 'forms', items: ['Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'] },
      { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
      { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language'] },
      { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
      { name: 'insert', items: ['Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe'] },
      { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
      { name: 'colors', items: ['TextColor', 'BGColor'] },
      { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
      { name: 'about', items: ['About'] }
    ],
    height: this.height,
    buttons: 'Link,Unlink,Image',
    widgets: 'image',
    fullPage: false,
    allowedContent: true,
    enterMode: 2,
  }
  toolbarset: object = {
    type: 'MultiRow',
    enableFloating: true,
    items: ['image', 'FileManager', '|', 'Bold', 'Italic', 'Underline', 'StrikeThrough',
      'FontName', 'FontSize', 'FontColor', 'BackgroundColor',
      'LowerCase', 'UpperCase', 'SuperScript', 'SubScript',
      '|', 'Formats', 'Alignments', 'OrderedList', 'UnorderedList', 'Outdent', 'Indent',
      '|', "createTable",
      "|", 'CreateLink', 'ClearFormat', "clearAll", 'Print', 'SourceCode', 'FullScreen',
      '|', 'Undo', 'Redo']
  };
  onChange() {
    this.strChange.emit(this.str);
  }
}
