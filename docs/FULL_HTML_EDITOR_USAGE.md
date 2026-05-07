# Full HTML Editor Usage Guide

## Overview
The `editerSyncfusion` component has been enhanced to support full HTML editing capabilities with both Syncfusion Rich Text Editor and CKEditor.

## Features

### 1. Syncfusion Rich Text Editor (Default)
- **Full HTML Support**: All HTML tags, attributes, and styles are allowed
- **No Content Filtering**: `enableHtmlEncode="false"` and `enableHtmlSanitizer="false"`
- **Enhanced Paste**: Preserves all formatting when pasting content
- **Source Code Editing**: Direct HTML source manipulation
- **Multi-row Toolbar**: Comprehensive editing tools

### 2. CKEditor (Toggle Mode)
- **Full Page Editing**: `fullPage: true` for complete HTML document editing
- **Unrestricted Content**: `allowedContent: true` and `extraAllowedContent: '*(*){*}[*]'`
- **Protected Sources**: Scripts, styles, and CDATA sections are preserved
- **No Auto-formatting**: Prevents unwanted paragraph wrapping

## Configuration Details

### Key Settings for Full HTML Support:

#### Syncfusion RTE:
```typescript
[enableHtmlEncode]="false"
[enableHtmlSanitizer]="false"
[pasteCleanupSettings]="pasteCleanupSettings"
```

#### CKEditor:
```typescript
fullPage: true,
allowedContent: true,
extraAllowedContent: '*(*){*}[*]',
disallowedContent: '',
htmlEncodeOutput: false,
entities: false,
autoParagraph: false
```

## Usage Examples

### Basic Usage:
```html
<editer-syncfusion 
  [(str)]="htmlContent"
  [height]="500"
  [isDisabled]="false">
</editer-syncfusion>
```

### Programmatic HTML Insertion:
```typescript
// Insert raw HTML
this.editorComponent.insertRawHtml('<div class="custom-widget">Custom Content</div>');

// Get raw HTML content
const htmlContent = this.editorComponent.getRawHtmlContent();

// Enable full HTML mode
this.editorComponent.enableFullHtmlMode();
```

### Advanced HTML Support:
The editors now support:
- Custom HTML elements and attributes
- Inline styles and CSS classes
- JavaScript event handlers (onclick, onload, etc.)
- Embedded styles and scripts
- Complex table structures
- Form elements with custom attributes
- SVG and multimedia content
- Data attributes (data-*)

## Toolbar Features

### Available Tools:
- **Source Code**: Direct HTML editing
- **Full Screen**: Immersive editing experience
- **Format Painter**: Copy and apply formatting
- **Media Support**: Image, Video, Audio insertion
- **Table Tools**: Advanced table creation and editing
- **Typography**: Complete font and styling controls
- **List Management**: Ordered and unordered lists
- **Link Management**: URL and anchor linking

## Security Considerations

⚠️ **Important**: With full HTML editing enabled, the component allows potentially dangerous content like:
- JavaScript code execution
- External resource loading
- CSS injection
- XSS vulnerabilities

Ensure proper backend validation and sanitization when saving content.

## Migration from Restricted Mode

If upgrading from a restricted HTML mode:
1. Test existing content for compatibility
2. Review security implications
3. Update backend validation rules
4. Consider content migration scripts

## Browser Support

Full HTML editing is supported in:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Common Issues:
1. **Content disappearing**: Check `allowedContent` settings
2. **Paste not working**: Verify `pasteCleanupSettings` configuration
3. **Toolbar missing**: Ensure all toolbar items are properly configured
4. **Source mode issues**: Check for conflicting HTML sanitization

### Debug Mode:
Enable browser developer tools to inspect HTML content and identify filtering issues.