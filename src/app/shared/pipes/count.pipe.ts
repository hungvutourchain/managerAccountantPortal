import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'count',
  standalone: false
})
export class CountPipe implements PipeTransform {
  transform(items: any[]): number {
    if (!items || !Array.isArray(items)) {
      return 0;
    }
    return items.length;
  }
}
