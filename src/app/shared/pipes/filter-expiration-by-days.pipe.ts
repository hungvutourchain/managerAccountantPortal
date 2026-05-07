import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterExpirationByDays',
  standalone: false
})
export class FilterExpirationByDaysPipe implements PipeTransform {
  transform(items: any[], minDays: number = 0, maxDays: number = 999): any[] {
    if (!items || !Array.isArray(items)) {
      return items;
    }

    const now = new Date();

    return items.filter(item => {
      if (!item.expirationDate) {
        return false;
      }

      const expirationDate = new Date(item.expirationDate);
      const daysUntilExpiration = Math.floor(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysUntilExpiration >= minDays && daysUntilExpiration <= maxDays;
    });
  }
}
