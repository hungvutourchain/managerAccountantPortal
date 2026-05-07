import {
  Component,
  Input,
  ViewEncapsulation,
  OnChanges,
  OnInit,
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
  PasteCleanupSettingsModel,
} from "@syncfusion/ej2-angular-richtexteditor";
import * as isglobals from "app/globals";
import { environment as env } from "environments/environment";
import { DbService } from "../../connectData/db.service";
import * as _ from "lodash";
import { DomSanitizer } from "@angular/platform-browser";

import md5 from "md5";
import { Platform } from "@angular/cdk/platform";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ChangeDetectorRef } from "@angular/core";

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
} from '@pqina/pintura';
@Component({  standalone: false,
  selector: "crooper-image",
  templateUrl: "./crooperImage.component.html",
  styleUrls: ["./crooperImage.component.scss"],
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
export class CrooperImageComponent implements OnChanges, OnInit {
  @Input() pageLoad: string = 'general';
  @Input() dateTimeFormat: string;
  @Input() str: string;
  @Input() Original: string;
  @Input() url: string;
  @Input() refreshImage: any;
  @Input() config: any = {};
  @Output() strChange = new EventEmitter<string>();
  @ViewChild("toolsRTE", { static: false })
  public rteObj: RichTextEditorComponent;
  @ViewChild('pinturaEditor', { static: false })
  public pinturaEditorComponent: any;
  public family: any;
  private hostUrl: string = env.syncFileManagerLocal;
  imageServerDomain = env.imageDomain + "/";
  showckeditor: boolean = false;
  public pasteCleanupSettings: PasteCleanupSettingsModel = {
    prompt: false,
    plainText: true,
    keepFormat: false,
  };
  public fileManagerSettings: FileManagerSettingsModel;
  public filterSettings: any = {
    caseSensitive: false,
    operator: "contains",
  };
  constructor(
    private dbService: DbService,
    protected _sanitizer: DomSanitizer,
    private _snackBar: MatSnackBar,
    private _platform: Platform,
    private cdr: ChangeDetectorRef
  ) {
    this.family = isglobals.familyFonts;
    this.fileManager();
  }
  fileManager() {
    this.fileManagerSettings = {
      enable: true,
      path: "/Pictures/Food",
      ajaxSettings: {
        // url: this.hostUrl + 'api/GoogleDriveProvider/GoogleDriveFileOperations',
        // getImageUrl: this.hostUrl + 'api/GoogleDriveProvider/GoogleDriveGetImage'
        url: this.hostUrl + "/api/FileManager/FileOperations",
        getImageUrl: this.hostUrl + "/api/FileManager/GetImage",
        downloadUrl: this.hostUrl + "/api/FileManager/Download",
        uploadUrl: this.hostUrl + "/api/FileManager/Upload",
      },
    };
  }
  
  ngOnInit() {
    this.setupPinturaEditor();
  }
  
  ngOnChanges() {
    this.str = this.str ?? "";
    this.configImage = this.config || {
      width: 700,
      height: 250,
    };
  }
  Cancel() {
    this.isDropImabe = false;
  }
  safeHtml(html) {
    return this._sanitizer.bypassSecurityTrustHtml(html) || null;
  }
  // Image
  configImage: any = {
    width: 700,
    height: 250,
  };
  stringImage: any = {};
  popupImage: boolean = false;
  isCrooperImage: boolean = false;
  isDropImabe: boolean = false;
  uniqId() {
    return md5(
      Math.round(new Date().getTime() + Math.random() * 100000).toString()
    );
  }
  openCropper() {
    this.isCrooperImage = true;
    if (!this.str) {
      this.selectNewImage();
    } else {
      this.imageLink = this.str;
    }
  }
  selectNewImage() {
    this.refreshImage = this.uniqId();
    this.isCrooperImage = false;
    this.popupImage = true;
  }
  TempImage: any = "";
  imageLink: any = "";
  
  // Pintura Editor Configuration
  pinturaEditor: any;
  pinturaEditorOptions: any;
  pinturaOptions: any;
  isUploadingProcessedImage: boolean = false;
  showPinturaEditor: boolean = false;
  shouldAutoUpload: boolean = false; // Flag to control automatic upload
  
  browserFile(ev, number) {
    if (ev) {
      this.isCrooperImage = true;
      this.TempImage = ev;
      this.imageLink = this.TempImage;
      
      // Configure editor first
      this.setupPinturaEditorForCrop();
      
      // Set editor to show immediately
      this.showPinturaEditor = true;
      
      // Force change detection
      this.cdr.detectChanges();
    } else {
      this.isCrooperImage = true;
      this.TempImage = ev;
    }
  }
  popupWebAddress: boolean = false;
  stringWebAddress: string = "";
  WebAddress(action) {
    switch (action) {
      case "open":
        this.stringWebAddress = "";
        this.popupWebAddress = true;
        this.isCrooperImage = false;
        break;
      case "OK":
        if (this.stringWebAddress) {
          this.popupWebAddress = false;
          this.imageLink = this.stringWebAddress;
        } else {
          this.popupWebAddress = false;
        }
        this.isCrooperImage = true;
        break;
      case "Cancel":
        this.stringWebAddress = "";
        this.popupWebAddress = false;
        this.isCrooperImage = true;
        break;
    }
  }
  
  // Initialize Pintura with all plugins
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
      util: 'crop' // Start with crop tool active
    };

    // Legacy options for backward compatibility
    this.pinturaEditorOptions = {
      // License key
      licenseKey: '5AD7A5B1-9E80-4C8C-9EEB-03C927E7EDC6',
      
      // Image reader and writer with MIME type fix
      imageReader: createDefaultImageReader({
        // Handle MIME type issues
        preprocessImageFile: async (file: File) => {
          console.log('📁 Processing file:', file.name, 'Type:', file.type);
          
          // If MIME type is missing or incorrect, try to detect from extension
          if (!file.type || 
              file.type === 'application/octet-stream' || 
              file.type === 'image/unknown' ||
              !file.type.startsWith('image/')) {
            
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
        }
      }),
      imageWriter: createDefaultImageWriter({
        quality: 0.9,
        targetSize: {
          width: this.configImage.width,
          height: this.configImage.height,
          fit: 'cover'
        }
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
        ...markup_editor_locale_en_gb
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
        [this.configImage.width / this.configImage.height, 1, 'Current Layout']
      ],
      
      // Color and font options for annotations
      colorOptions: [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
      ],
      fontFamilyOptions: [
        ['Arial', 'Arial, sans-serif'],
        ['Helvetica', 'Helvetica, sans-serif'], 
        ['Times New Roman', 'Times New Roman, serif'],
        ['Georgia', 'Georgia, serif']
      ],
      
      // Size constraints
      imageSize: {
        width: this.configImage.width,
        height: this.configImage.height
      },
      
      // Style customization
      style: {
        '--pintura-editor-toolbar-height': '60px',
        '--pintura-editor-background-color': '#1a1a1a',
        '--pintura-editor-toolbar-background-color': '#2d2d2d'
      }
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
      }
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
      [targetRatio, 1] // Current Layout
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
        const editor = this.pinturaEditorComponent.editor || 
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
    console.log('🖼️ Pintura Process Event:', event);
    console.log('🚦 shouldAutoUpload flag:', this.shouldAutoUpload);

    // Only process if we explicitly requested it via Save button
    if (!this.shouldAutoUpload) {
      console.log('⏸️ Auto-upload disabled - skipping process event');
      return;
    }

    // Reset flag after processing
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
          this.notifi('error', '❌ Failed to upload image: ' + (uploadError?.message || 'Unknown error'));
        }
      } else if (result.dest instanceof HTMLCanvasElement) {
        // For canvas, convert to blob first (better quality than base64)
        console.log('🖼️ Converting canvas to blob for better quality');
        result.dest.toBlob((blob: Blob | null) => {
          if (blob) {
            console.log('✅ Canvas converted to blob:', blob.size, 'bytes');
            console.log('🚀 Starting blob upload process...');
            try {
              this.uploadProcessedImageFile(blob);
            } catch (uploadError: any) {
              console.error('❌ Blob upload error:', uploadError);
              this.notifi('error', '❌ Failed to upload processed image: ' + (uploadError?.message || 'Unknown error'));
            }
          } else {
            console.error('❌ Failed to convert canvas to blob');
          }
        }, 'image/jpeg', 0.92); // High quality JPEG
      } else {
        console.error('❌ Unexpected result format:', result.dest);
      }
    } else {
      console.error('❌ No processed image result');
    }
  }

  onPinturaClose() {
    this.showPinturaEditor = false;
    this.isCrooperImage = false;
  }

  closePinturaEditor() {
    this.showPinturaEditor = false;
    this.cdr.detectChanges();
  }

  // Complete image processing workflow
  completeImageProcessing() {
    // Close Pintura editor
    this.showPinturaEditor = false;
    this.isCrooperImage = false;
    
    // Reset temporary variables
    this.imageLink = '';
    this.TempImage = '';
    
    // Force change detection to update UI
    this.cdr.detectChanges();
  }

  onPinturaReady() {
    // Editor ready for use
  }

  onPinturaError(error: any) {
    console.error('❌ Pintura editor error:', error);
    this.isUploadingProcessedImage = false;
    this.notifi('error', '❌ Error with image editor: ' + (error.message || 'Unknown error'));
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
            if (rs && rs.path) {
              this.str = this.imageServerDomain + rs.path;
              this.strChange.emit(this.str);
              this.completeImageProcessing();
              this.notifi('success', '✅ Image processed and saved successfully!');
            } else {
              this.notifi('warning', '⚠️ Upload successful but no path returned');
            }
          },
          error: (error) => {
            console.error('❌ Server upload failed, trying fallback:', error);
            this.tryFallbackUpload(file);
          }
        });
      } else {
        this.tryFallbackUpload(file);
      }
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      this.isUploadingProcessedImage = false;
      this.notifi('error', '❌ Failed to upload image: ' + (error as any)?.message || 'Unknown error');
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
      this.notifi('error', '❌ Failed to save processed image');
      this.isUploadingProcessedImage = false;
    };
    reader.readAsDataURL(file);
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
          this.str = this.imageServerDomain + rs.path;
          this.strChange.emit(this.str);
          this.completeImageProcessing();
          this.notifi('success', '✅ Image processed and saved successfully!');
        } else {
          this.notifi('warning', '⚠️ Failed to save processed image');
        }
      },
      error: (error) => {
        this.isUploadingProcessedImage = false;
        console.error('❌ Server upload failed:', error);
        this.notifi('error', '❌ Error saving image: ' + (error.message || 'Unknown error'));
      }
    });
  }

  openPinturaEditor() {
    if (this.imageLink) {
      this.setupPinturaEditorForCrop();
      this.showPinturaEditor = true;
      this.cdr.detectChanges();
    } else {
      this.notifi('warning', 'Please select an image first');
    }
  }

  // Save edited image to server
  async saveEditedImage() {
    console.log('💾 Save button clicked');
    console.log('📸 Pintura Editor Component:', this.pinturaEditorComponent);
    
    if (!this.pinturaEditorComponent) {
      console.error('❌ Editor component not found via ViewChild');
      this.notifi('error', '❌ Editor not ready. Please wait for the editor to load.');
      return;
    }

    // Get the actual editor instance
    const editorInstance = this.pinturaEditorComponent.editor || 
                          this.pinturaEditorComponent.nativeElement?.editor ||
                          this.pinturaEditorComponent;
    
    console.log('� Editor Instance:', editorInstance);
    console.log('🔍 Instance type:', editorInstance?.constructor?.name);
    console.log('🔍 Available properties:', editorInstance ? Object.keys(editorInstance).slice(0, 20) : []);
    console.log('🔍 Available methods:', editorInstance ? Object.keys(editorInstance).filter(k => typeof editorInstance[k] === 'function').slice(0, 20) : []);

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
      }
      else if (editorInstance?.editor && typeof editorInstance.editor.process === 'function') {
        console.log('✅ Using nested editor.process method');
        result = await editorInstance.editor.process();
      }
      else {
        console.error('❌ No process method found on editor or component');
        console.log('📋 Component structure:', {
          component: this.pinturaEditorComponent,
          editor: editorInstance,
          componentKeys: Object.keys(this.pinturaEditorComponent || {}),
          editorKeys: Object.keys(editorInstance || {})
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
      this.notifi('error', '❌ Error processing image: ' + (error.message || 'Unknown error'));
    }
  }
  
  imageChangedEvent: any = "";
  
  onRemoveImage() {
    this.str = "";
    this.imageLink = "";
    this.strChange.emit(this.str);
    this.isCrooperImage = false;
  }
  onApplyOriginal() {
    this.str = this.imageLink;
    this.strChange.emit(this.str);
    this.isCrooperImage = false;
  }
  
  onCropped() {
    // Trigger Pintura editor to process and save
    this.saveEditedImage();
  }
  
  ClosePopupImage($event) {
    console.log('closed');
    this.isCrooperImage = true;
    this.popupImage = false;
    this.imageLink = this.hostUrl + this.stringImage.icon;
    
    // Auto-open Pintura editor when image is selected
    if (this.imageLink) {
      console.log('🎨 Auto-opening Pintura editor after image selection');
      this.setupPinturaEditorForCrop();
      this.showPinturaEditor = true;
      this.cdr.detectChanges();
    }
  }
  
  notifi(type, mes, time = 4000, confirm = "OK"): void {
      this._snackBar.open(mes, confirm, {
          duration: time,
          verticalPosition: 'top', horizontalPosition: 'center'
      })
  }
}
