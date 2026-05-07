import {
  Component,
  Input,
  ViewEncapsulation,
  OnChanges,
  ViewChild,
  EventEmitter,
  Output,
} from "@angular/core";
import {
  ToolbarService,
  LinkService,
  ImageService,
  HtmlEditorService,
  TableService,
  FileManagerSettingsModel,
  FileManagerService,
  QuickToolbarService,
  RichTextEditorComponent,
  PasteCleanupService,
  CountService,
} from "@syncfusion/ej2-angular-richtexteditor";
import * as isglobals from "app/globals";
import { environment as env } from "environments/environment";
import { DbService } from "../../connectData/db.service";
import * as _ from "lodash";
import { DomSanitizer } from "@angular/platform-browser";
import md5 from "md5";
import { Platform } from "@angular/cdk/platform";

@Component({  standalone: false,
  selector: "upload-file",
  templateUrl: "./UploadFile.component.html",
  styleUrls: ["./UploadFile.component.scss"],
  encapsulation: ViewEncapsulation.None,
  providers: [
    ToolbarService,
    LinkService,
    ImageService,
    HtmlEditorService,
    TableService,
    QuickToolbarService,
    FileManagerService,
    PasteCleanupService,
    CountService,
  ],
})
export class UploadFileComponent implements OnChanges {
  @Input() dateTimeFormat: string;
  @Input() str: string;
  @Input() refreshImage: any;
  @Input() config: any = {};
  @Output() strChange = new EventEmitter<string>();
  @ViewChild("toolsRTE", { static: false })
  public rteObj: RichTextEditorComponent;
  public family: any;
  private hostUrl: string = env.syncFileManagerLocal;
  public fileManagerSettings: FileManagerSettingsModel;
  // Image
  configImage: any;
  stringImage: any = {};
  popupImage: boolean = false;
  isDropImabe: boolean = false;

  constructor(
    private dbService: DbService,
    protected _sanitizer: DomSanitizer,
    private _platform: Platform
  ) {
    this.family = isglobals.familyFonts;
    this.fileManager();
  }
  fileManager() {
    this.fileManagerSettings = {
      enable: true,
      path: "/Pictures",
      ajaxSettings: {
        url: this.hostUrl + "/api/FileManager/FileOperations",
        getImageUrl: this.hostUrl + "/api/FileManager/GetImage",
        downloadUrl: this.hostUrl + "/api/FileManager/Download",
        uploadUrl: this.hostUrl + "/api/FileManager/Upload",
      },
    };
  }
  ngOnChanges() {
    this.str = this.str ?? "";
    this.configImage = this.config || {
      width: 700,
      height: 250,
    };
  }
  uniqId() {
    return md5(
      Math.round(new Date().getTime() + Math.random() * 100000).toString()
    );
  }
  selectNewImage() {
    this.refreshImage = this.uniqId();
    this.popupImage = true;
  }
  ClosePopupImage(event) {
    console.log(event);
    this.strChange.emit(this.str);
    this.popupImage = false;
  }
}
