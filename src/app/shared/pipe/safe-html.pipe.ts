import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: false,
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): any {
    let html = this.sanitizer.bypassSecurityTrustHtml(value ?? '');
    console.log('safeHtmlPipe', html);  // Debugging purposes, remove in production.
    return html;
  }
}
