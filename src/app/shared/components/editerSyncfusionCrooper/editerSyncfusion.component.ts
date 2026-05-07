import {
  Component,
  Input,
  ViewEncapsulation,
  OnChanges,
  OnInit,
  AfterViewInit,
  OnDestroy,
  DoCheck,
  ViewChild,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
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
  PasteCleanupSettingsModel,
} from '@syncfusion/ej2-angular-richtexteditor';
import * as isglobals from 'app/globals';
import { environment as env } from 'environments/environment';
import { DbService } from '../../connectData/db.service';
import * as _ from 'lodash';
import { UserService } from 'app/core/user/user.service';
import { DomSanitizer } from '@angular/platform-browser';
import md5 from 'md5';
// Pintura Core imports
import {
  // Core functionality
  createDefaultImageReader,
  createDefaultImageWriter,
  createDefaultShapePreprocessor,
  setPlugins,
  locale_en_gb,
  getEditorDefaults,

  // All Pintura plugins for full functionality
  plugin_crop,
  plugin_crop_locale_en_gb,
  plugin_finetune,
  plugin_finetune_locale_en_gb,
  plugin_filter,
  plugin_filter_locale_en_gb,
  plugin_annotate,
  plugin_annotate_locale_en_gb,
  plugin_decorate,
  plugin_decorate_locale_en_gb,
  plugin_sticker,
  plugin_sticker_locale_en_gb,
  plugin_resize,
  plugin_resize_locale_en_gb,
  plugin_frame,
  plugin_frame_locale_en_gb,
  plugin_redact,
  plugin_redact_locale_en_gb,
  // Markup editor for annotations
  markup_editor_defaults,
  markup_editor_locale_en_gb,
  // Additional utilities (remove if not available)
  // createDefaultColorOptions,
  // createDefaultFontFamilyOptions,
  // createDefaultFontSizeOptions,
  // createDefaultLineHeightOptions
} from '@pqina/pintura';

@Component({
  standalone: false,
  selector: 'editer-syncfusion',
  templateUrl: './editerSyncfusion.component.html',
  styleUrls: ['./editerSyncfusion.component.scss'],
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
export class EditerSyncfusionCrooperComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy, DoCheck {
  @Input() dateTimeFormat: string;
  @Input() str: string;
  @Input() dir: string = '';
  @Input() languageCode: string = 'en';
  @Input() isDisabled: boolean = false;
  @Input() isMinimal: boolean = false;
  @Input() isNoteMode: boolean = false;
  @Input() enterMode: number = 1;
  @Input() height: number = 400;
  @Output() strChange = new EventEmitter<string>();
  @Output() dialogStateChange = new EventEmitter<boolean>();
  private _prevDialogOpen: boolean = false;
  @ViewChild('toolsRTE', { static: false })
  public rteObj: RichTextEditorComponent;
  @ViewChild('pinturaEditor', { static: false })
  public pinturaEditorComponent: any;
  @ViewChild('fileUploadInput', { static: false })
  public fileUploadInput: ElementRef;
  private pendingUploadNumber: number = 0;
  // [Vấn đề 3 - disabled] private savedRteRange: Range | null = null;
  // [Vấn đề 3 - disabled] private savedCkBookmark: any = null;
  SpeechPopup: boolean = false;
  viewheight: number;

  ngDoCheck() {
    const isOpen = this.isOpenImageCropper || this.popupImage || this.popupWebAddress || this.SpeechPopup;
    if (isOpen !== this._prevDialogOpen) {
      this._prevDialogOpen = isOpen;
      setTimeout(() => this.dialogStateChange.emit(isOpen));
    }
  }
  language: any;
  originalSize: any = {
    width: 500,
    height: 500,
  };
  public family: any;
  user: any = {};
  enterKey: any = 'P';
  private hostUrl: string = env.syncFileManagerLocal;
  imageServerDomain = env.imageDomain + '/';
  showckeditor: boolean = false;
  public pasteCleanupSettings: PasteCleanupSettingsModel = {
    prompt: false,
    plainText: false,  // Allow HTML content including iframes
    keepFormat: true,  // Keep formatting
    deniedTags: [],    // Don't deny any tags - allow iframe, script, etc.
    deniedAttrs: [],   // Don't deny any attributes
    allowedStyleProps: ['all'], // Allow all style properties
  };
  public fileManagerSettings: FileManagerSettingsModel;
  public filterSettings: any = {
    caseSensitive: false,
    operator: 'contains',
  };

  // Pintura Editor Configuration
  pinturaEditor: any;
  pinturaEditorOptions: any;
  pinturaOptions: any;
  isUploadingProcessedImage: boolean = false;
  showPinturaEditor: boolean = false;
  shouldAutoUpload: boolean = false; // Flag to control automatic upload

  constructor(
    private dbService: DbService,
    private _userService: UserService,
    protected _sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this._userService.user$.subscribe(async (user: any) => {
      if (user && user?._id) {
        this.user = user;
        this.family = isglobals.familyFonts;
        this.fileManager();
      }
    });
  }

  ngOnInit() {
    this.setupPinturaEditor();
  }

  ngOnDestroy() {
    // Destroy RTE trước khi component bị xóa để tránh lỗi selectionchange/getDocument
    this.rteObj?.destroy();
  }

  toggleEditor() {
    // Nếu đang hiện RTE (showckeditor=true) và chuyển sang CKEditor → destroy trước
    if (this.showckeditor) {
      this.rteObj?.destroy();
    }
    this.showckeditor = !this.showckeditor;
  }

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
        uploadUrl: this.hostUrl + '/api/FileManager/Upload',
      },
    };
  }
  ngOnChanges() {
    this.str = this.str ?? '';
    this.dir = this.dir || 'ltr';
    this.language = {
      ui: 'en',
      content: this.languageCode,
    };
    this.viewheight = this.height;
    this.ckeditConfig.height = this.height;
    if (this.enterMode) {
      this.enterKey = 'BR';
      this.enterKey = this.enterMode == 1 ? 'P' : 'BR';
      this.ckeditConfig.enterMode = this.enterMode === 1 ? 1 : 2;
    }
    this.ckeditConfig.contentsLangDirection = this.dir || 'ltr';

    if (this.isNoteMode) {
      this.ckeditConfig.toolbarCanCollapse = true;
      this.ckeditConfig.toolbar = [
        { name: 'basicstyles', items: [ 'NumberedList',
            'BulletedList',
            '-', 'Bold', 'Italic', 'Underline'] },
        { name: 'colors', items: ['TextColor', 'BGColor'] },
        { name: 'insert', items: ['Image'] },
        { name: 'clipboard', items: ['Undo', 'Redo'] },
      ];
      this.toolbarset = {
        type: 'MultiRow',
        enableFloating: false,
        items: [
          'Bold', 'Italic', 'Underline',
          '|',
          'FontColor', 'BackgroundColor',
          '|',
          'Image',
          '|',
          'Undo', 'Redo',
        ],
      };
    } else if (this.isMinimal) {
      this.ckeditConfig.toolbarCanCollapse = true;
      this.ckeditConfig.toolbar = [
        {
          name: 'document',
          items: ['Source', '-', 'Save', 'NewPage', 'ExportPdf', 'Preview', 'Print', '-', 'Templates'],
        },
        {
          name: 'clipboard',
          items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
        },
        {
          name: 'editing',
          items: ['Find', 'Replace', '-', 'SelectAll', '-', 'Scayt'],
        },
        {
          name: 'forms',
          items: [
            'Form',
            'Checkbox',
            'Radio',
            'TextField',
            'Textarea',
            'Select',
            'Button',
            'ImageButton',
            'HiddenField',
          ],
        },
        {
          name: 'basicstyles',
          items: [
            'Bold',
            'Italic',
            'Underline',
            'Strike',
            'Subscript',
            'Superscript',
            '-',
            'CopyFormatting',
            'RemoveFormat',
          ],
        },
        {
          name: 'paragraph',
          items: [
            'NumberedList',
            'BulletedList',
            '-',
            'Outdent',
            'Indent',
            '-',
            'JustifyLeft',
            'JustifyCenter',
            'JustifyRight',
            'JustifyBlock',
            '-',
            'BidiLtr',
            'BidiRtl',
            'Language',
          ],
        },
        { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
        {
          name: 'insert',
          items: ['Image', 'Table', 'HorizontalRule', 'PageBreak'],
        },
        { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
        { name: 'colors', items: ['TextColor', 'BGColor'] },
        { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
      ];
      this.toolbarset = {
        type: 'Expand',
        enableFloating: true,
        items: [
          'Bold',
          'Italic',
          'Underline',
          'FontName',
          'FontSize',
          'FontColor',
          'BackgroundColor',
          '|',
          'Outdent',
          'Indent',
          'Formats',
          'Alignments',
          '|',
          'NumberFormatList',
          'BulletFormatList',
          '|',
          'CreateLink',
          'Image',
          'FileManager',
          'Video',
          'Audio',
          'CreateTable',
          '|',
          'FormatPainter',
          'ClearFormat',
          'Undo',
          'Redo',
          '|',
          'SourceCode',
          'FullScreen',
        ],
      };
    }
  }
  ckeditConfig: any = {
    versionCheck: false,
    toolbar: [
      {
        name: 'document',
        items: ['Source', '-', 'Save', 'NewPage', 'ExportPdf', 'Preview', 'Print', '-', 'Templates'],
      },
      {
        name: 'clipboard',
        items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
      },
      {
        name: 'editing',
        items: ['Find', 'Replace', '-', 'SelectAll', '-', 'Scayt'],
      },
      {
        name: 'forms',
        items: ['Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'],
      },
      {
        name: 'basicstyles',
        items: [
          'Bold',
          'Italic',
          'Underline',
          'Strike',
          'Subscript',
          'Superscript',
          '-',
          'CopyFormatting',
          'RemoveFormat',
        ],
      },
      {
        name: 'paragraph',
        items: [
          'NumberedList',
          'BulletedList',
          '-',
          'Outdent',
          'Indent',
          '-',
          'Blockquote',
          'CreateDiv',
          '-',
          'JustifyLeft',
          'JustifyCenter',
          'JustifyRight',
          'JustifyBlock',
          '-',
          'BidiLtr',
          'BidiRtl',
          'Language',
        ],
      },
      { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
      {
        name: 'insert',
        items: ['Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe'],
      },
      { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
      { name: 'colors', items: ['TextColor', 'BGColor'] },
      { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
      { name: 'about', items: ['About'] },
    ],
    height: 400,
    buttons: 'Link,Unlink,Image',
    widgets: 'image',
    fullPage: false,
    allowedContent: true,
    enterMode: 2,
    colorButton_colors: '5A5A5A,BEBEBF,454545,FFF,DDD,CCEAEE,66AB16',
    colorButton_enableAutomatic: false,
  };
  toolbarset: object = {
    type: 'MultiRow',
    enableFloating: true,
    items: [
      'Bold',
      'Italic',
      'Underline',
      'StrikeThrough',
      'SuperScript',
      'SubScript',
      '|',
      'FontName',
      'FontSize',
      'FontColor',
      'BackgroundColor',
      '|',
      'LowerCase',
      'UpperCase',
      '|',
      'Formats',
      'Alignments',
      '|',
      'NumberFormatList',
      'BulletFormatList',
      '|',
      'Outdent',
      'Indent',
      '|',
      'CreateLink',
      'Image',
      'FileManager',
      'Video',
      'Audio',
      'CreateTable',
      '|',
      'FormatPainter',
      'ClearFormat',
      '|',
      'EmojiPicker',
      'Print',
      '|',
      'SourceCode',
      'FullScreen',
      '|',
      'Undo',
      'Redo',
    ],
  };
  _contentview: any;
  isOpenImageCropper: boolean = false;
  tempContent: string;
  ActionChange(action) {
    switch (action) {
      case 'apply':
        if (this.Object.imageHtml) {
          let before: string;
          let after: string;

          // [Vấn đề 3 enabled] — cursor position saved in textBefore/textAfter: use them directly
          // [Vấn đề 3 disabled] — determine position by layout type (top vs bottom)
          if (this.Object.textBefore !== undefined && this.Object.textAfter !== undefined && this.Object._cursorPositionSaved) {
            before = this.Object.textBefore;
            after = this.Object.textAfter;
          } else {
            // Bottom layouts: insert image after existing content
            const bottomTypes = [6, 7, 8];
            if (bottomTypes.includes(this.Object.type)) {
              before = this.str || '';
              after = '';
            } else {
              // Top layouts (1, 2, 3, 4, 5, 9, 10, 11): insert image before existing content
              before = '';
              after = this.str || '';
            }
          }

          this.str = before + this.Object.imageHtml + after;
          this.Cancel();
          this.strChange.emit(this.str);
        } else alert('Select Layout content');
        break;
    }
  }
  Cancel() {
    this.isUploadImage = false;
  }
  safeHtml(html) {
    return this._sanitizer.bypassSecurityTrustHtml(html) || null;
  }
  onChange(evn) {
    this.str = evn;
    this.strChange.emit(this.str);
  }
  // [Vấn đề 3 - disabled] Capture editor cursor position at mousedown (before button click blurs the editor)
  // saveEditorSelection() {
  //   this.savedRteRange = null;
  //   this.savedCkBookmark = null;
  //
  //   if (this.showckeditor && this.rteObj) {
  //     // Syncfusion RTE — capture native window selection
  //     const sel = window.getSelection();
  //     if (sel && sel.rangeCount > 0) {
  //       this.savedRteRange = sel.getRangeAt(0).cloneRange();
  //     }
  //   } else {
  //     // CKEditor
  //     try {
  //       const instances = (window as any).CKEDITOR?.instances;
  //       if (instances) {
  //         const editor = Object.values(instances as any)[0] as any;
  //         const sel = editor?.getSelection?.();
  //         if (sel) {
  //           // createBookmarks(true) = serializable: inserts real <span> markers into DOM
  //           this.savedCkBookmark = sel.createBookmarks(true);
  //         }
  //       }
  //     } catch (e) {
  //       // ignore — no selection available
  //     }
  //   }
  // }

  // Image

  ObjectValue() {
    // [Vấn đề 3 - disabled] cursor position restoration — uncomment block below to re-enable
    // const MARKER = '<span id="__cm__"></span>';
    // let textBefore = '';
    // let textAfter = this.str || '';
    //
    // if (this.showckeditor && this.rteObj) {
    //   // Syncfusion RTE — restore saved range then insert marker via execCommand
    //   if (this.savedRteRange) {
    //     try {
    //       const contentEl = (this.rteObj as any).inputElement as HTMLElement;
    //       if (contentEl) {
    //         contentEl.focus();
    //         const sel = window.getSelection();
    //         if (sel) {
    //           sel.removeAllRanges();
    //           sel.addRange(this.savedRteRange);
    //           document.execCommand('insertHTML', false, MARKER);
    //           const withMarker = contentEl.innerHTML || '';
    //           const idx = withMarker.indexOf(MARKER);
    //           if (idx !== -1) {
    //             textBefore = withMarker.substring(0, idx);
    //             textAfter = withMarker.substring(idx + MARKER.length);
    //             contentEl.querySelector('#__cm__')?.remove();
    //             this.str = textBefore + textAfter;
    //           } else {
    //             textBefore = this.str || '';
    //             textAfter = '';
    //           }
    //         }
    //       } else {
    //         textBefore = this.str || '';
    //         textAfter = '';
    //       }
    //     } catch (e) {
    //       textBefore = this.str || '';
    //       textAfter = '';
    //     }
    //   } else {
    //     textBefore = this.str || '';
    //     textAfter = '';
    //   }
    // } else {
    //   // CKEditor
    //   try {
    //     const instances = (window as any).CKEDITOR?.instances;
    //     if (instances) {
    //       const editor = Object.values(instances as any)[0] as any;
    //       if (editor) {
    //         const startId = this.savedCkBookmark?.[0]?.startNode;
    //         const endId = this.savedCkBookmark?.[0]?.endNode;
    //
    //         if (startId) {
    //           const withBookmarks = editor.getData() || '';
    //           if (withBookmarks.includes(startId)) {
    //             const startIdx = withBookmarks.indexOf(startId);
    //             const spanStart = withBookmarks.lastIndexOf('<', startIdx);
    //             const spanEnd = withBookmarks.indexOf('</span>', startIdx) + '</span>'.length;
    //             textBefore = withBookmarks.substring(0, spanStart);
    //             let afterPart = withBookmarks.substring(spanEnd);
    //
    //             if (endId && afterPart.includes(endId)) {
    //               const eIdx = afterPart.indexOf(endId);
    //               const eStart = afterPart.lastIndexOf('<', eIdx);
    //               const eEnd = afterPart.indexOf('</span>', eIdx) + '</span>'.length;
    //               afterPart = afterPart.substring(0, eStart) + afterPart.substring(eEnd);
    //             }
    //
    //             textAfter = afterPart;
    //             editor.setData(textBefore + textAfter);
    //             this.str = textBefore + textAfter;
    //           } else {
    //             textBefore = this.str || '';
    //             textAfter = '';
    //           }
    //         } else {
    //           textBefore = this.str || '';
    //           textAfter = '';
    //         }
    //       }
    //     }
    //   } catch (e) {
    //     textBefore = this.str || '';
    //     textAfter = '';
    //   }
    // }

    // Vấn đề 3 disabled: position will be determined in ActionChange based on layout type
    let textBefore = undefined;
    let textAfter = undefined;

    // NOTE: khi bật lại Vấn đề 3, thêm _cursorPositionSaved: true vào Object
    // để ActionChange biết dùng textBefore/textAfter từ cursor thay vì tính theo type
    this.Object = {
      nation: this.user.nation,
      type: 1,
      textBefore,
      textAfter,
      // _cursorPositionSaved: true,  // [Vấn đề 3] uncomment khi re-enable cursor fix
    };
    this.changelsTypeOption(this.Object.type);
    this.isUploadImage = true;
  }

  // classes = this.sRenderer.renderSheet(STYLES);
  // croppedImage?: string;
  // scale: number;
  // ready: boolean;
  // minScale: number;
  // @ViewChild(LyImageCropper, { static: false }) cropper: LyImageCropper;
  // myConfig: ImgCropperConfig = {
  //   // autoCrop: true,
  //   width: 230, // Default `250`
  //   height: 130, // Default `200`
  //   fill: '#ff2997', // Default transparent if type = png else #000
  //   type: 'image/png', // Or you can also use `image/jpeg`
  //   responsiveArea: true,
  //   keepAspectRatio: true,
  //   resizableArea: true,
  //   output: {
  //     width: 230,
  //     height: 130
  //   }
  // };
  imgUrl: any = '';

  lsTypeOption: any = [
    {
      id: 1,
      name: 'Layout Image 1 - Top One Full Wide',
      icon: 'image/template/1.png',
      bootstrapIcon: 'bi bi-image',
      style: { with: '', height: '' },
    },
    {
      id: 2,
      name: 'Layout Image 2 - Top Two landscape Images (340x180)',
      icon: 'image/template/2.png',
      bootstrapIcon: 'bi bi-layout-split',
      style: { with: '', height: '' },
    },
    {
      id: 3,
      name: 'Layout Image 3 - Top Three Images',
      icon: 'image/template/3.png',
      bootstrapIcon: 'bi bi-layout-three-columns',
      style: { with: '', height: '' },
    },
    {
      id: 4,
      name: 'Layout Image 4 - Left Image',
      icon: 'image/template/4.png',
      bootstrapIcon: 'bi bi-layout-text-sidebar',
      style: { with: '', height: '' },
    },
    {
      id: 5,
      name: 'Layout Image 5 - Right Image',
      icon: 'image/template/5.png',
      bootstrapIcon: 'bi bi-layout-text-sidebar-reverse',
      style: { with: '', height: '' },
    },
    {
      id: 6,
      name: 'Layout Image 6 - Bottom Three Images',
      icon: 'image/template/6.png',
      bootstrapIcon: 'bi bi-layout-three-columns',
      style: { with: '', height: '' },
    },
    {
      id: 7,
      name: 'Layout Image 7 - Bottom Two Images',
      icon: 'image/template/7.png',
      bootstrapIcon: 'bi bi-layout-split',
      style: { with: '', height: '' },
    },
    {
      id: 8,
      name: 'Layout Image 8 - Bottom One Full Wide',
      icon: 'image/template/8.png',
      bootstrapIcon: 'bi bi-layout-text-window-reverse',
      style: { with: '', height: '' },
    },
    {
      id: 9,
      name: 'Layout Image 9 - Top One Full Wide Image Title',
      icon: 'image/template/1.png',
      bootstrapIcon: 'bi bi-image-alt',
      style: { with: '', height: '' },
    },
    {
      id: 10,
      name: 'Layout Image 10 - Two Top Image - Portrait  (340x420)',
      icon: 'image/template/2.png',
      bootstrapIcon: 'bi bi-images',
      style: { with: '', height: '' },
    },
    {
      id: 11,
      name: 'Layout Image 11 - Panorama Image',
      icon: 'image/template/1.png',
      bootstrapIcon: 'bi bi-image',
      style: { with: '700', height: '350' },
    },
  ];
  // action change type template
  changelsTypeOption(event) {
    let object = this.lsTypeOption.find((x) => x.id === event);
    this.Object.icon = object.icon;
    if (!object) this.Object.type = 1;
    switch (this.Object.type) {
      // 1 && 8
      case 1:
        this.configImage = {
          width: 700,
          height: 400,
        };
        break;
      case 11:
        this.configImage = {
          width: 700,
          height: 350,
        };
        break;
      case 8:
        this.configImage = {
          width: 700,
          height: 400,
        };
        break;
      // 2 && 7 345, 180
      case 2:
        this.configImage = {
          width: 340,
          height: 180,
        };
        break;
      case 10:
        this.configImage = {
          width: 340,
          height: 420,
        };
        break;
      case 7:
        this.configImage = {
          width: 230,
          height: 130,
        };
        break;
      // 3 && 6
      case 3:
        this.configImage = {
          width: 230,
          height: 130,
        };
        break;
      case 6:
        this.configImage = {
          width: 230,
          height: 130,
        };
        break;
      // 4 && 5
      case 4:
        this.configImage = {
          width: 230,
          height: 130,
        };
        break;
      case 5:
        this.configImage = {
          width: 230,
          height: 130,
        };
        break;
      case 9:
        this.configImage = {
          width: 700,
          height: 250,
        };
        break;
    }
    this.RenderContent();
  }
  configImage: any = {
    width: 700,
    height: 250,
  };
  Object: any = {};
  stringImage: any = {};
  popupImage: boolean = false;
  isUploadImage: boolean = false;
  RenderContent() {
    let imageHtml = '';
    switch (this.Object.type) {
      // 1, 11 (panorama), 8 (bottom) — all full-width single image, position determined by cursor
      case 1:
      case 11:
      case 8:
        imageHtml = `<div style="margin:0;padding:0;line-height:0;"><img style="width:100%;display:block;" src="${this.Object.imageCropper1}"/></div>`;
        break;
      case 9:
        imageHtml = `<div style="margin:0;padding:0;line-height:0;"><img style="width:100%;display:block;" src="${this.Object.imageCropper1}"/></div>${this.Object.header || ''}`;
        break;
      // 2, 10 (portrait), 7 (bottom) — two-image layout, position determined by cursor
      case 2:
      case 10:
        imageHtml = `
        <table cellpadding="1" cellspacing="1" style="width: 100%;">
          <tbody>
              <tr>
                  <td style="width: ${this.configImage.width}px;">
                      <div style="float: left; margin: 0 4px 4px 0;width: ${this.configImage.width}px; height: ${this.configImage.height}px;position: relative;">
                          <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                              <img style="width: ${this.configImage.width}px; height: ${this.configImage.height}px;" src="${this.Object.imageCropper1}"/>
                          </div>
                      </div>
                  </td>
                  <td style="width: ${this.configImage.width}px;">
                      <div style="float: right; margin: 0 4px 4px 0;width: ${this.configImage.width}px; height: ${this.configImage.height}px;position: relative;">
                          <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                              <img style="width: ${this.configImage.width}px; height: ${this.configImage.height}px;" src="${this.Object.imageCropper2}"/>
                          </div>
                      </div>
                  </td>
              </tr>
          </tbody>
        </table>
        `;
        break;
      case 7:
        imageHtml = `
        <table border="0" cellpadding="1" cellspacing="1" style="width: 100%;">
          <tbody>
            <tr>
                <td style="width: ${this.configImage.width}px;">
                    <div style="float: left; margin: 0 4px 4px 0;width: ${this.configImage.width}px; height: ${this.configImage.height}px;position: relative;">
                        <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                            <img style="width: ${this.configImage.width}px; height: ${this.configImage.height}px;" src="${this.Object.imageCropper1}"/>
                        </div>
                    </div>
                </td>
                <td style="width: ${this.configImage.width}px;">
                    <div style="float: right; margin: 0 4px 4px 0;width: ${this.configImage.width}px; height: ${this.configImage.height}px;position: relative;">
                        <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                            <img style="width: ${this.configImage.width}px; height: ${this.configImage.height}px;" src="${this.Object.imageCropper2}"/>
                        </div>
                    </div>
                </td>
            </tr>
          </tbody>
        </table>
        `;
        break;
      // 3 && 6 — three-image layout, position determined by cursor
      case 3:
      case 6:
        imageHtml = `
        <table border="0" cellpadding="1" cellspacing="1" style="width: 100%;">
          <tbody>
            <tr>
                <td>
                    <div style="float: left; margin: 0 4px 4px 0;width: ${this.configImage.width}px; height: ${this.configImage.height}px;position: relative;">
                        <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                            <img style="width: ${this.configImage.width}px; height: ${this.configImage.height}px;" src="${this.Object.imageCropper1}"/>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="float: left; margin: 0 4px 4px 0;width: ${this.configImage.width}px; height: ${this.configImage.height}px;position: relative;">
                        <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                            <img style="width: ${this.configImage.width}px; height: ${this.configImage.height}px;" src="${this.Object.imageCropper2}"/>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="float: left; margin: 0 4px 4px 0;width: ${this.configImage.width}px; height: ${this.configImage.height}px;position: relative;">
                        <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                            <img style="width: ${this.configImage.width}px; height: ${this.configImage.height}px;" src="${this.Object.imageCropper3}"/>
                        </div>
                    </div>
                </td>
            </tr>
          </tbody>
        </table>
        `;
        break;
      // case 6 merged into case 3 above

      // 4 && 5 — float layouts, position determined by cursor
      case 4:
        imageHtml = `<div style="float: left; margin: 0 4px 4px 0;width: ${this.configImage.width}px;position: relative;">
                <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                    <img style="width: ${this.configImage.width}px; float: left;" src="${this.Object.imageCropper1}"/>
                </div>
            </div>`;
        break;
      case 5:
        imageHtml = `<div style="float: right; margin: 0 4px 4px 0;width: ${this.configImage.width}px;position: relative;">
                <div style="width: 100%; height: 100%; position: relative;overflow: hidden;">
                    <img style="width: ${this.configImage.width}px;" src="${this.Object.imageCropper1}"/>
                </div>
            </div>`;
        break;
    }
    this.Object.imageHtml = imageHtml;
    this.Object.content = imageHtml;
    this._contentview = this.safeHtml(imageHtml);
  }

  private getRequiredImageCount(): number {
    switch (this.Object.type) {
      case 3: case 6: return 3;
      case 2: case 7: case 10: return 2;
      default: return 1;
    }
  }

  private areAllImagesSelected(): boolean {
    const count = this.getRequiredImageCount();
    if (count >= 1 && !this.Object.imageCropper1) return false;
    if (count >= 2 && !this.Object.imageCropper2) return false;
    if (count >= 3 && !this.Object.imageCropper3) return false;
    return true;
  }
  ClosePopupImage($event) {
    this.popupImage = false;
    this.imgUrl = this.hostUrl + this.stringImage.icon;

    console.log('🖼️ ClosePopupImage - imgUrl set to:', this.imgUrl);

    // Auto-open Pintura editor when image is selected
    if (this.imgUrl) {
      console.log('🎨 Auto-opening Pintura editor after image selection');
      this.isOpenImageCropper = true;  // Only open Image Cropper after image is actually selected
      this.setupPinturaEditorForCrop();
      this.showPinturaEditor = true;
      this.cdr.detectChanges();
    }
  }
  uniqId() {
    return md5(Math.round(new Date().getTime() + Math.random() * 100000).toString());
  }
  refreshPopup: boolean = false;
  selectNewImage() {
    if (this.TempNumber) {
      this.popupImage = true;
      this.refreshPopup = !this.refreshPopup;
    } else alert('select Image theme.');
  }
  TempImage: any = '';
  TempNumber: number = 0;

  // Helper method to create proper File object with correct MIME type
  async createFileFromUrl(url: string): Promise<string> {
    try {
      console.log('🌐 Fetching image from URL:', url);
      const response = await fetch(url);
      const blob = await response.blob();

      // Get filename from URL and ensure proper extension
      const urlParts = url.split('/');
      let filename = urlParts[urlParts.length - 1] || 'image.jpg';

      // If filename doesn't have extension, add .jpg
      if (!filename.includes('.')) {
        filename += '.jpg';
      }

      // Determine MIME type from URL or default to jpeg
      let mimeType = blob.type;

      if (!mimeType || mimeType === 'application/octet-stream' || mimeType === 'image/unknown') {
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'png':
            mimeType = 'image/png';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'image/jpeg';
        }
      }

      // Create proper File object
      const file = new File([blob], filename, { type: mimeType });
      // Create object URL for display
      const objectUrl = URL.createObjectURL(file);

      return objectUrl;
    } catch (error) {
      console.error('❌ Error creating file from URL:', error);
      return url; // Fallback to original URL
    }
  }

  browserFile(ev, number) {
    this.TempNumber = number;
    if (ev) {
      this.isOpenImageCropper = true;
      this.TempImage = ev;
      this.imgUrl = this.TempImage;

      // Configure editor first
      this.setupPinturaEditorForCrop();

      // Set editor to show immediately
      this.showPinturaEditor = true;

      // Force change detection
      this.cdr.detectChanges();
    } else {
      // No existing image — open Image Cropper dialog with all source options
      this.isOpenImageCropper = true;
      this.imgUrl = '';
      this.showPinturaEditor = false;
      this.cdr.detectChanges();
    }
  }

  triggerFileUpload(number: number) {
    this.pendingUploadNumber = number;
    if (this.fileUploadInput) {
      this.fileUploadInput.nativeElement.click();
    }
  }

  onLocalFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const objectUrl = URL.createObjectURL(file);
      this.isOpenImageCropper = true;
      this.TempImage = objectUrl;
      this.imgUrl = objectUrl;
      this.TempNumber = this.pendingUploadNumber;
      this.setupPinturaEditorForCrop();
      this.showPinturaEditor = true;
      this.cdr.detectChanges();
      // Reset so same file can be selected again
      input.value = '';
    }
  }
  popupWebAddress: boolean = false;
  stringWebAddress: string = '';
  WebAddress(action) {
    switch (action) {
      case 'open':
        this.stringWebAddress = '';
        this.popupWebAddress = true;
        this.isOpenImageCropper = false;
        break;
      case 'OK':
        if (this.stringWebAddress) {
          this.popupWebAddress = false;
          this.imgUrl = this.stringWebAddress;
          this.isOpenImageCropper = true;

          console.log('🌐 Web address set:', this.stringWebAddress);

          // Configure editor first
          this.setupPinturaEditorForCrop();

          // Show Pintura editor
          this.showPinturaEditor = true;
          console.log('✅ showPinturaEditor set to:', this.showPinturaEditor);

          // Force change detection
          this.cdr.detectChanges();
          console.log('🔄 Change detection triggered for web URL');
        } else {
          this.popupWebAddress = false;
        }
        break;
      case 'Cancel':
        this.stringWebAddress = '';
        this.popupWebAddress = false;
        this.isOpenImageCropper = true;
        break;
    }
  }
  outSpeech(ev) {
    this.str += ` ${ev}`;
    this.SpeechPopup = false;
  }
  removeImage(imageIndex: number): void {
    switch (imageIndex) {
      case 1:
        this.Object.imageCropper1 = null;
        this.Object.image1 = null;
        break;
      case 2:
        this.Object.imageCropper2 = null;
        this.Object.image2 = null;
        break;
      case 3:
        this.Object.imageCropper3 = null;
        this.Object.image3 = null;
        break;
    }
  }

  // Initialize Pintura with all plugins
  ngAfterViewInit() {
    this.setupPinturaEditor();
  }

  setupPinturaEditor() {
    // Set license key for Pintura
    try {
      (window as any).PINTURA_LICENSE_KEY = '5AD7A5B1-9E80-4C8C-9EEB-03C927E7DDC3';
    } catch (error) {
      console.warn('Could not set Pintura license key:', error);
    }

    // Set all plugins including redact plugin
    setPlugins(
      plugin_crop,
      plugin_finetune,
      plugin_filter,
      plugin_annotate,
      plugin_decorate,
      plugin_sticker,
      plugin_resize,
      plugin_frame,
      plugin_redact
    );

    // Setup simplified Pintura options using getEditorDefaults
    this.pinturaOptions = {
      ...getEditorDefaults(),
      licenseKey: '5AD7A5B1-9E80-4C8C-9EEB-03C927E7DDC3',
      utils: ['crop', 'finetune', 'filter', 'annotate', 'decorate', 'sticker', 'resize', 'frame', 'redact'],
      util: 'crop', // Start with crop tool active
    };

    // Legacy options for backward compatibility
    this.pinturaEditorOptions = {
      // License key (alternative approach)
      licenseKey: '5AD7A5B1-9E80-4C8C-9EEB-03C927E7EDC6',

      // Image reader and writer with MIME type fix
      imageReader: createDefaultImageReader({
        // Handle MIME type issues
        preprocessImageFile: async (file: File) => {
          console.log('📁 Processing file:', file.name, 'Type:', file.type);

          // If MIME type is missing or incorrect, try to detect from extension
          if (
            !file.type ||
            file.type === 'application/octet-stream' ||
            file.type === 'image/unknown' ||
            !file.type.startsWith('image/')
          ) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            let mimeType = 'image/jpeg'; // default

            switch (extension) {
              case 'png':
                mimeType = 'image/png';
                break;
              case 'jpg':
              case 'jpeg':
                mimeType = 'image/jpeg';
                break;
              case 'gif':
                mimeType = 'image/gif';
                break;
              case 'webp':
                mimeType = 'image/webp';
                break;
              case 'bmp':
                mimeType = 'image/bmp';
                break;
              case 'svg':
                mimeType = 'image/svg+xml';
                break;
            }

            console.log(`🔧 Fixed MIME type from "${file.type}" to "${mimeType}" for file: ${file.name}`);
            return new File([file], file.name, { type: mimeType });
          }

          return file;
        },
      }),
      imageWriter: createDefaultImageWriter({
        quality: 0.9,
        targetSize: {
          width: this.configImage.width,
          height: this.configImage.height,
          fit: 'cover',
        },
      }),
      shapePreprocessor: createDefaultShapePreprocessor(),

      // Complete localization
      locale: {
        ...locale_en_gb,
        ...plugin_crop_locale_en_gb,
        ...plugin_finetune_locale_en_gb,
        ...plugin_filter_locale_en_gb,
        ...plugin_annotate_locale_en_gb,
        ...plugin_decorate_locale_en_gb,
        ...plugin_sticker_locale_en_gb,
        ...plugin_resize_locale_en_gb,
        ...plugin_frame_locale_en_gb,
        ...plugin_redact_locale_en_gb,
        ...markup_editor_locale_en_gb,
      },

      // Markup editor configuration for annotations
      ...markup_editor_defaults,

      // All available tools
      utils: ['crop', 'finetune', 'filter', 'annotate', 'decorate', 'sticker', 'resize', 'frame', 'redact'],

      // Crop tool configuration
      cropSelectPresetOptions: [
        [1, 1, 'Square'],
        [16, 9, 'Landscape'],
        [9, 16, 'Portrait'],
        [4, 3, '4:3'],
        [3, 2, '3:2'],
        [this.configImage.width / this.configImage.height, 1, 'Current Layout'],
      ],

      // Sticker options (you can customize these)
      stickerOptions: ['./assets/stickers/star.svg', './assets/stickers/heart.svg'],

      // Color and font options for annotations (using default options)
      colorOptions: [
        '#000000',
        '#ffffff',
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#ffff00',
        '#ff00ff',
        '#00ffff',
        '#ffa500',
        '#800080',
      ],
      fontFamilyOptions: [
        ['Arial', 'Arial, sans-serif'],
        ['Helvetica', 'Helvetica, sans-serif'],
        ['Times New Roman', 'Times New Roman, serif'],
        ['Georgia', 'Georgia, serif'],
      ],

      // Size constraints
      imageSize: {
        width: this.configImage.width,
        height: this.configImage.height,
      },

      // UI configuration
      willRenderToolbar: (toolbar: any, env: any, redraw: any) => {
        // Customize toolbar if needed
        return toolbar;
      },

      // Style customization
      style: {
        '--pintura-editor-toolbar-height': '60px',
        '--pintura-editor-background-color': '#1a1a1a',
        '--pintura-editor-toolbar-background-color': '#2d2d2d',
      },
    };
  }

  setupPinturaEditorForCrop() {
    // Call base setup first to ensure pinturaOptions exists
    this.setupPinturaEditor();

    // Update pinturaOptions (used by template) to focus on crop
    this.pinturaOptions = {
      ...this.pinturaOptions,
      util: 'crop', // Start with crop tool active
      cropLimitToImage: false,
      cropSelectPresetFilter: 'landscape',
      cropSelectPresetIndex: this.getCropPresetIndex(),
    };

    // Also update legacy options for backward compatibility
    this.pinturaEditorOptions = {
      ...this.pinturaEditorOptions,
      util: 'crop',
      cropLimitToImage: false,
      cropSelectPresetFilter: 'landscape',
      cropSelectPresetIndex: this.getCropPresetIndex(),

      // Enable crop immediately
      willRenderCanvas: (shapes: any, state: any) => {
        // Auto-activate crop tool when editor loads
        if (state.util !== 'crop') {
          setTimeout(() => {
            if (this.pinturaEditor && this.pinturaEditor.util !== 'crop') {
              this.pinturaEditor.util = 'crop';
              console.log('🎯 Crop tool activated automatically');
            }
          }, 500);
        }
        return shapes;
      },
    };

    console.log('✅ Pintura configured for crop tool');
  }

  getCropPresetIndex(): number {
    // Calculate which preset matches our layout aspect ratio
    const targetRatio = this.configImage.width / this.configImage.height;
    const presets = [
      [1, 1], // Square
      [16, 9], // Landscape
      [9, 16], // Portrait
      [4, 3], // 4:3
      [3, 2], // 3:2
      [targetRatio, 1], // Current Layout
    ];

    // Return index of layout preset (last one)
    return presets.length - 1;
  }

  // Pintura Editor Event Handlers
  onPinturaInit(event: any) {
    console.log('🎨 Pintura Init Event:', event);

    // Use ViewChild to get the actual editor instance
    setTimeout(() => {
      if (this.pinturaEditorComponent) {
        console.log('🎯 Pintura Editor Component found via ViewChild');

        // The editor instance might be in different properties
        const editor =
          this.pinturaEditorComponent.editor ||
          this.pinturaEditorComponent.nativeElement?.editor ||
          this.pinturaEditorComponent;

        this.pinturaEditor = editor;
        console.log('✅ Pintura Editor initialized:', this.pinturaEditor);

        if (editor) {
          // Set available utils
          if (typeof editor.util !== 'undefined') {
            editor.util = 'crop';
            console.log('🎯 Crop tool activated');
          }
        }
      } else {
        console.warn('⚠️ Pintura Editor Component not found via ViewChild');
      }
    }, 100);
  }

  onPinturaProcess(event: any) {
    // Reset shouldAutoUpload flag (used by saveEditedImage programmatic trigger)
    this.shouldAutoUpload = false;

    // The result might be in event.detail or the event itself
    const result = event?.detail || event;

    console.log('✅ Image processed successfully - Result:', result);

    // Handle processed image from Pintura
    if (result && result.dest) {
      console.log('📦 Result destination type:', result.dest.constructor.name);
      console.log('📏 Result destination size:', result.dest.size || 'unknown');

      // Check if it's a File/Blob - save directly without base64 conversion
      if (result.dest instanceof File || result.dest instanceof Blob) {
        console.log('📤 Uploading processed image to server...');
        // Upload file directly
        try {
          this.uploadProcessedImageFile(result.dest);
        } catch (uploadError: any) {
          console.error('❌ Upload error:', uploadError);
          alert('❌ Failed to upload image: ' + (uploadError?.message || 'Unknown error'));
        }
      } else if (result.dest instanceof HTMLCanvasElement) {
        // For canvas, convert to blob first (better quality than base64)
        console.log('🖼️ Converting canvas to blob for better quality');
        result.dest.toBlob(
          (blob: Blob | null) => {
            if (blob) {
              console.log('✅ Canvas converted to blob:', blob.size, 'bytes');
              console.log('🚀 Starting blob upload process...');
              try {
                this.uploadProcessedImageFile(blob);
              } catch (uploadError: any) {
                console.error('❌ Blob upload error:', uploadError);
                alert('❌ Failed to upload processed image: ' + (uploadError?.message || 'Unknown error'));
              }
            } else {
              console.error('❌ Failed to convert canvas to blob');
            }
          },
          'image/jpeg',
          0.92
        ); // High quality JPEG
      } else {
        console.error('❌ Unexpected result format:', result.dest);
      }
    } else {
      console.error('❌ No processed image result');
    }
  }

  onPinturaClose() {
    this.showPinturaEditor = false;
    this.isOpenImageCropper = false;
  }

  closePinturaEditor() {
    this.showPinturaEditor = false;
    this.cdr.detectChanges();
  }

  // Complete image processing workflow
  completeImageProcessing() {
    console.log('🏁 Completing image processing...');
    console.log('📸 Current Object state:', {
      imageCropper1: this.Object.imageCropper1,
      imageCropper2: this.Object.imageCropper2,
      imageCropper3: this.Object.imageCropper3
    });
    
    // Close Pintura editor
    this.showPinturaEditor = false;
    this.isOpenImageCropper = false;

    // Reset temporary variables
    this.imgUrl = '';
    this.TempImage = '';
    this.TempNumber = 0; // Reset temp number

    // Force change detection to update UI
    this.cdr.detectChanges();
    
    console.log('✅ Image processing completed - Editor closed');
  }

  onPinturaReady() {
    // Editor ready for use
  }

  onPinturaError(error: any) {
    console.error('❌ Pintura editor error:', error);
    this.isUploadingProcessedImage = false;
    alert('❌ Error with image editor: ' + (error.message || 'Unknown error'));
  }

  // Fallback method for base64 upload
  private uploadProcessedImageBase64(base64Image: string) {
    const uploadObject = {
      base64image: base64Image,
      name: `pintura_${this.uniqId()}.jpg`,
      dir: 'pintura_processed',
    };

    this.dbService.pushFileImage(uploadObject).subscribe({
      next: (rs: any) => {
        this.isUploadingProcessedImage = false;
        console.log('✅ Image uploaded to server successfully');
        if (rs && rs.path) {
          this.Object['imageCropper' + this.TempNumber] = this.imageServerDomain + rs.path;
          this.Object['image' + this.TempNumber] = this.imgUrl;
          this.RenderContent();
          this.completeImageProcessing();
          alert('✅ Image processed and saved successfully!');
        } else {
          alert('⚠️ Failed to save processed image');
        }
      },
      error: (error) => {
        this.isUploadingProcessedImage = false;
        console.error('❌ Server upload failed:', error);
        alert('❌ Error saving image: ' + (error.message || 'Unknown error'));
      },
    });
  }

  // Method to upload processed image file from Pintura (Blob/File)
  private uploadProcessedImageFile(file: File | Blob) {
    console.log('📤 uploadProcessedImageFile called with:', file);
    this.isUploadingProcessedImage = true;

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Create proper filename
      const fileName = file instanceof File ? file.name : `pintura_${this.uniqId()}.jpg`;
      formData.append('file', file, fileName);
      formData.append('name', fileName);
      formData.append('dir', 'pintura_processed');

      // Try direct upload first
      if (this.dbService && this.dbService.uploadPinturaProcessedImage) {
        this.dbService.uploadPinturaProcessedImage(formData).subscribe({
          next: (rs: any) => {
            this.isUploadingProcessedImage = false;
            console.log('✅ Image uploaded to server successfully');
            console.log('📦 Server response:', rs);
            
            // Check different response formats
            const imagePath = rs?.path || rs?.data?.path || rs?.filePath;
            
            if (imagePath) {
              console.log('🖼️ Image path found:', imagePath);
              console.log('🔢 Saving to image slot:', this.TempNumber);
              
              // Save the cropped image URL
              this.Object['imageCropper' + this.TempNumber] = this.imageServerDomain + imagePath;
              this.Object['image' + this.TempNumber] = this.imgUrl;
              
              console.log('✅ Image saved to Object:', {
                slot: this.TempNumber,
                croppedUrl: this.Object['imageCropper' + this.TempNumber],
                originalUrl: this.Object['image' + this.TempNumber]
              });
              
              // Re-render the content with the new image
              this.RenderContent();
              
              // Close the editor
              this.completeImageProcessing();

              // Auto-apply only when all required images for this layout are selected
              if (this.areAllImagesSelected()) {
                this.ActionChange('apply');
              }
            } else {
              console.error('⚠️ No path found in response:', rs);
              alert('⚠️ Upload successful but no path returned');
            }
          },
          error: (error) => {
            console.error('❌ Server upload failed, trying fallback:', error);
            this.tryFallbackUpload(file);
          },
        });
      } else {
        this.tryFallbackUpload(file);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      this.isUploadingProcessedImage = false;
      alert('❌ Failed to upload image: ' + (error as any)?.message || 'Unknown error');
    }
  }

  // Fallback method to convert file to base64 and upload
  private tryFallbackUpload(file: File | Blob) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result as string;
      this.uploadProcessedImageBase64(base64Image);
    };
    reader.onerror = () => {
      console.error('❌ Failed to convert file to base64');
      alert('❌ Failed to save processed image');
      this.isUploadingProcessedImage = false;
    };
    reader.readAsDataURL(file);
  }
  // Legacy method for Pintura processed images (base64)

  onApplyOriginal() {
    this.Object['imageCropper' + this.TempNumber] = this.imgUrl;
    this.Object['image' + this.TempNumber] = this.imgUrl;
    this.RenderContent();
    this.showPinturaEditor = false;
    this.isOpenImageCropper = false;
    this.imgUrl = '';
    // Auto-apply only when all required images for this layout are selected
    if (this.areAllImagesSelected()) {
      this.ActionChange('apply');
    }
    this.cdr.detectChanges();
  }

  openPinturaEditor() {
    if (this.imgUrl) {
      this.setupPinturaEditorForCrop();
      this.showPinturaEditor = true;
      this.cdr.detectChanges();
    } else {
      alert('Please select an image first');
    }
  }

  // Save edited image to server
  async saveEditedImage() {
    console.log('💾 Save button clicked');
    console.log('📸 Pintura Editor Component:', this.pinturaEditorComponent);

    if (!this.pinturaEditorComponent) {
      console.error('❌ Editor component not found via ViewChild');
      alert('❌ Editor not ready. Please wait for the editor to load.');
      return;
    }

    // Get the actual editor instance
    const editorInstance =
      this.pinturaEditorComponent.editor ||
      this.pinturaEditorComponent.nativeElement?.editor ||
      this.pinturaEditorComponent;

    console.log('� Editor Instance:', editorInstance);
    console.log('🔍 Instance type:', editorInstance?.constructor?.name);
    console.log('🔍 Available properties:', editorInstance ? Object.keys(editorInstance).slice(0, 20) : []);
    console.log(
      '🔍 Available methods:',
      editorInstance
        ? Object.keys(editorInstance)
            .filter((k) => typeof editorInstance[k] === 'function')
            .slice(0, 20)
        : []
    );

    this.isUploadingProcessedImage = true;

    try {
      console.log('🔄 Starting image processing...');
      
      // Set flag to allow upload on process event
      this.shouldAutoUpload = true;

      let result;

      // Try to call processImage on the component itself
      if (typeof this.pinturaEditorComponent.processImage === 'function') {
        console.log('✅ Using component.processImage method');
        result = await this.pinturaEditorComponent.processImage();
      }
      // Try to call process on the component
      else if (typeof this.pinturaEditorComponent.process === 'function') {
        console.log('✅ Using component.process method');
        result = await this.pinturaEditorComponent.process();
      }
      // Try to call processImage on the editor instance
      else if (editorInstance && typeof editorInstance.processImage === 'function') {
        console.log('✅ Using editor.processImage method');
        result = await editorInstance.processImage();
      }
      // Try to call process on the editor instance
      else if (editorInstance && typeof editorInstance.process === 'function') {
        console.log('✅ Using editor.process method');
        result = await editorInstance.process();
      }
      // Check if there's a nested editor property
      else if (editorInstance?.editor && typeof editorInstance.editor.processImage === 'function') {
        console.log('✅ Using nested editor.processImage method');
        result = await editorInstance.editor.processImage();
      } else if (editorInstance?.editor && typeof editorInstance.editor.process === 'function') {
        console.log('✅ Using nested editor.process method');
        result = await editorInstance.editor.process();
      } else {
        console.error('❌ No process method found on editor or component');
        console.log('📋 Component structure:', {
          component: this.pinturaEditorComponent,
          editor: editorInstance,
          componentKeys: Object.keys(this.pinturaEditorComponent || {}),
          editorKeys: Object.keys(editorInstance || {}),
        });
        throw new Error('Cannot find process method on editor');
      }

      console.log('✅ Image processed successfully:', result);

      // The onPinturaProcess event will be triggered automatically
      // and will handle the upload since shouldAutoUpload is now true
      
    } catch (error: any) {
      console.error('❌ Error processing image:', error);
      this.isUploadingProcessedImage = false;
      this.shouldAutoUpload = false; // Reset flag on error
      alert('❌ Error processing image: ' + (error.message || 'Unknown error'));
    }
  }
}
