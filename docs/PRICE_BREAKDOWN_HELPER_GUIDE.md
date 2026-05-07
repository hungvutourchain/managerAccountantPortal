# Price Breakdown Helper Service - Migration Guide

## 📋 Overview

`PriceBreakdownHelper` là shared service để tính toán breakdown table hiển thị:
- **Price per Adult** (Land + Accommodation)
- **Price per Child** by age ranges (Land + Accommodation)  
- **Tour Leader** costs
- **Grand Total**

## 🎯 Mục đích

Thay thế **duplicate logic** ở 2 nơi:
1. ❌ `common.service.ts`: `PriceCardChildPolicy()` - Empty function
2. ✅ `templateExport.service.ts`: `generateDetailedBreakdownTableB2C()` - Có logic đầy đủ

## 🔧 How to Use

### 1. Inject Service

```typescript
import { PriceBreakdownHelper } from 'app/shared/helpers/price-breakdown.helper';

constructor(private priceBreakdownHelper: PriceBreakdownHelper) {}
```

### 2. Calculate Combined Child Totals (Land + Hotel)

```typescript
// You need to provide a function to get hotel data
// This allows different components to use their own hotel data retrieval logic
const getDataHotels = (tour: any) => {
  // For templateExport.service.ts:
  return this.getDataHotels(tour);
  
  // For PaxManagementHotel.component.ts:
  return this.paxCalculationHelper.getUniversalHotelData(this.info, this.QuotePriceIsItem, this.quote);
};

const combinedChildTotals = this.priceBreakdownHelper.calculateCombinedChildTotals(
  tour,
  QuotePriceIsItem,
  getDataHotels
);

// Result: Array of child totals by age range
// [
//   { from: 1, to: 5, qty: 2, total: 321875, landTotal: 160937.5, hotelTotal: 160937.5 },
//   { from: 6, to: 11, qty: 1, total: 450000, landTotal: 250000, hotelTotal: 200000 }
// ]
```

### 3. Calculate Hotel Adult Total

```typescript
const hotelAdultTotal = this.priceBreakdownHelper.calculateHotelAdultTotal(
  tour,
  QuotePriceIsItem,
  getDataHotels
);

// Returns: Total hotel cost for ADULTS only (e.g., 1,500,000)
```

### 4. Get Total Price Per Adult (Land + Hotel)

```typescript
const totalPricePerAdult = this.priceBreakdownHelper.getTotalPricePerAdult(
  tour,
  QuotePriceIsItem,
  getDataHotels
);

// Returns: Combined land + hotel total for all adults (e.g., 5,000,000)
```

### 5. Get Total Number of Adults

```typescript
const totalAdults = this.priceBreakdownHelper.getTotalAdults(tour, QuotePriceIsItem);

// Returns: Number of adult passengers (e.g., 8)
```

### 6. Calculate Grand Total

```typescript
const grandTotal = this.priceBreakdownHelper.calculateGrandTotal(
  totalAdultAmount,
  combinedChildTotals,
  tour.leaderTotal || 0,
  tour.landSellPrice || 0,
  tour.accommodationSellPrice || 0,
  tour.TotalSurchargesHotel || 0,
  otherExtraCostPrice,
  tour.additionalFee || 0
);

// Returns: Final grand total including all costs (e.g., 12,500,000)
```

## 📝 Migration Examples

### Example 1: templateExport.service.ts

**BEFORE** (Duplicate code):
```typescript
generateDetailedBreakdownTableB2C(tour: any, isLanguage: any, currency: any, QuotePriceIsItem): string {
  // 200+ lines of duplicate logic
  const combinedChildTotals = this.calculateCombinedChildTotalsForExport(tour, QuotePriceIsItem);
  const totalAdults = this.getTotalAdultsForExport(tour, QuotePriceIsItem);
  const totalCombinedAdults = this.getTotalPricePerAdultForExport(tour, QuotePriceIsItem);
  // ...
}
```

**AFTER** (Using shared helper):
```typescript
generateDetailedBreakdownTableB2C(tour: any, isLanguage: any, currency: any, QuotePriceIsItem): string {
  // Reuse shared logic!
  const getDataHotels = (tour: any) => this.getDataHotels(tour);
  
  const combinedChildTotals = this.priceBreakdownHelper.calculateCombinedChildTotals(
    tour, QuotePriceIsItem, getDataHotels
  );
  
  const totalAdults = this.priceBreakdownHelper.getTotalAdults(tour, QuotePriceIsItem);
  
  const totalCombinedAdults = this.priceBreakdownHelper.getTotalPricePerAdult(
    tour, QuotePriceIsItem, getDataHotels
  );
  
  const pricePerAdult = totalAdults > 0 ? totalCombinedAdults / totalAdults : 0;
  
  // Generate HTML table...
}
```

### Example 2: common.service.ts - PriceCardChildPolicy()

**BEFORE** (Empty function):
```typescript
PriceCardChildPolicy(tour, isLanguage, generalBookingTitle, strDate, CountryName) {
  // TODO: Implement this
}
```

**AFTER** (Using shared helper):
```typescript
PriceCardChildPolicy(tour, isLanguage, generalBookingTitle, strDate, CountryName) {
  const QuotePriceIsItem = tour.QuotePriceIsItem;
  const getDataHotels = (tour: any) => {
    // Use existing hotel data retrieval logic
    return this.getUniversalHotelData(tour, QuotePriceIsItem);
  };
  
  const combinedChildTotals = this.priceBreakdownHelper.calculateCombinedChildTotals(
    tour, QuotePriceIsItem, getDataHotels
  );
  
  const totalAdults = this.priceBreakdownHelper.getTotalAdults(tour, QuotePriceIsItem);
  const totalPricePerAdult = this.priceBreakdownHelper.getTotalPricePerAdult(
    tour, QuotePriceIsItem, getDataHotels
  );
  const pricePerAdult = totalAdults > 0 ? totalPricePerAdult / totalAdults : 0;
  
  // Generate price card HTML here...
  let html = `
    <tr>
      <td>Price per Adult</td>
      <td>${this.NumberFormatStyles(pricePerAdult, tour.Curency)}</td>
      <td>${totalAdults}</td>
      <td>${this.NumberFormatStyles(totalPricePerAdult, tour.Curency)}</td>
    </tr>
  `;
  
  combinedChildTotals.forEach(childTotal => {
    const pricePerChild = childTotal.qty > 0 ? childTotal.total / childTotal.qty : 0;
    html += `
      <tr>
        <td>Price per Child (${childTotal.from}-${childTotal.to})</td>
        <td>${this.NumberFormatStyles(pricePerChild, tour.Curency)}</td>
        <td>${childTotal.qty}</td>
        <td>${this.NumberFormatStyles(childTotal.total, tour.Curency)}</td>
      </tr>
    `;
  });
  
  return html;
}
```

## ✅ Benefits

### Before (Problems):
- ❌ **200+ lines duplicate code** in 2 files
- ❌ **Hard to maintain** - fix bug in one place, forget the other
- ❌ **Inconsistent calculations** - small differences between implementations
- ❌ **Empty function** in common.service.ts

### After (Solutions):
- ✅ **Single source of truth** - one implementation
- ✅ **Easy maintenance** - fix once, works everywhere
- ✅ **Consistent calculations** - same logic guaranteed
- ✅ **Reusable** - can be used in any component/service

## 🎯 Key Points

1. **Uses Pre-calculated Values**: Prefers `tour.dataPaxManagementLandingTotal` (already calculated by edit.component.ts)
2. **Fallback Calculation**: If pre-calculated values not available, calculates from `Items_Calculator`
3. **Exact Logic**: Matches `PaxManagementHotel.component.ts` exactly
4. **Flexible Hotel Data**: Accepts custom `getDataHotels` function for different contexts

## 🔄 Migration Steps

1. ✅ Create `price-breakdown.helper.ts`
2. ⏳ Update `templateExport.service.ts` to use helper (remove duplicate methods)
3. ⏳ Implement `common.service.ts` `PriceCardChildPolicy()` using helper
4. ⏳ Test both implementations
5. ⏳ Remove old duplicate methods

## 📚 Related Files

- `price-breakdown.helper.ts` - New shared helper
- `pax-calculation.helper.ts` - Used for landing totals calculation
- `templateExport.service.ts` - Consumer #1
- `common.service.ts` - Consumer #2
- `PaxManagementHotel.component.ts` - Reference implementation
- `view-assign-pax-total.service.ts` - Similar logic for UI display

## 🚀 Next Steps

Sau khi tạo helper, cần:
1. Refactor `templateExport.service.ts` để dùng helper thay vì duplicate code
2. Implement `PriceCardChildPolicy()` trong `common.service.ts`
3. Test kỹ cả 2 places để đảm bảo kết quả giống nhau
4. Remove các duplicate methods: `calculateCombinedChildTotalsForExport`, `getTotalPricePerAdultForExport`, etc.
