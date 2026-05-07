import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: false
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) {
      return items;
    }

    const lowerSearchText = searchText.toLowerCase();

    return items.filter(item => {
      // Search through all object properties
      for (const key in item) {
        if (item.hasOwnProperty(key)) {
          const value = item[key];
          if (value && value.toString().toLowerCase().includes(lowerSearchText)) {
            return true;
          }
        }
      }
      return false;
    });
  }
}
