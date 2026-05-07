# Refactoring Plan - Tour Calculation Services

## 🎯 Objective
Consolidate duplicate calculation logic from EditComponent and PaxManagement components into reusable services and helpers for better maintainability and consistency.

## 📊 Current State Analysis

### Existing Shared Code
- ✅ **PaxCalculationHelper**: Already handles hotel/landing data filtering and detailed totals
- ✅ **QuotePriceHelperService**: Handles QuotePrice filtering and child policies
- ⚠️ **Gaps**: Commission calculations, grand total logic, and calculation patterns are still duplicated

## 🔧 Proposed Services

### 1. CommissionCalculationService
**Purpose**: Centralize all commission-related calculations

**Functions to Extract:**
```typescript
// From EditComponent
calculateCommissions()              → calculateCommissions(info, roundOption)
convertMarginChangeCommission()     → convertMarginToMarkup(item)
convertMarkupChangeCommission()     → convertMarkupToMargin(item)
reCalculatorSurchagesHotelCommissions() → calculateSurchargeCommissions(info)

// Benefits:
- ✅ Single source of truth for commission logic
- ✅ Consistent commission calculations across components
- ✅ Easier testing and maintenance
- ✅ Reusable by EditComponent, PaxManagement, and other components
```

### 2. TotalCalculationService
**Purpose**: Handle grand total and price calculations

**Functions to Extract:**
```typescript
// From EditComponent
grandTotalCalcutator()              → calculateGrandTotal(info, landingTotal, hotelTotal)
reCalculatorLandingHotelGroupQuote() → calculateMultipleQuoteTotals(info, quotePrice)
calculateDetailedHotelTotals()      → calculateDetailedTotals(info, context)

// Utility Methods:
calculateAndRound(items, property, roundOption) → Generic calculation helper
applyAdditionalFees(total, info)               → Handle additional fees
applySellPrices(total, info)                   → Handle land/accommodation sell prices

// Benefits:
- ✅ Eliminates duplicate calculation logic
- ✅ Fixes current bugs in multiple quote price calculations
- ✅ Consistent rounding and fee application
- ✅ Easier to unit test complex calculation scenarios
```

### 3. Enhanced PaxCalculationHelper
**Purpose**: Extend existing helper with more calculation utilities

**New Functions to Add:**
```typescript
// Calculation Patterns
calculatePropertyTotals<T>(items: T[], properties: string[], roundOption): any
filterByQuotePrice<T>(items: T[], quotePriceIsItem: string): T[]
calculateChildTotalsByAge(services: any[], policies: any[]): any[]

// FOC (Free of Charge) Calculations
calculateFocDiscounts(services: any[]): any[]
applyFocToServices(services: any[]): void

// Service Processing
processServiceCommissions(services: any[], info: any): void
calculateServiceTotals(services: any[], roundOption: any): any

// Benefits:
- ✅ Consolidates duplicate patterns into reusable utilities
- ✅ Type-safe generic methods for better code quality
- ✅ Centralized business logic for complex calculations
```

## 🎨 Refactoring Strategy

### Phase 1: Extract Commission Service
1. Create `CommissionCalculationService`
2. Move commission methods from EditComponent
3. Update EditComponent to use service
4. Test commission calculations

### Phase 2: Extract Total Calculation Service  
1. Create `TotalCalculationService`
2. Move total calculation methods
3. Fix multiple quote price bugs during extraction
4. Update components to use service

### Phase 3: Enhance Existing Helpers
1. Add utility methods to `PaxCalculationHelper`
2. Extract common patterns into generic methods
3. Update all components to use enhanced helper

### Phase 4: Clean Up Components
1. Remove duplicate code from components
2. Simplify component logic by using services
3. Add comprehensive unit tests for services
4. Update documentation

## 🔍 Code Quality Improvements

### Before (Duplicate Logic):
```typescript
// EditComponent
const calculateAndRoundTotal = (property) =>
  this.afac.cround(
    activeAcc.reduce((total, current) => total + current[property], 0),
    this.info.roundOption
  );

// PaxManagementHotel (similar logic)
calculatePropertyTotal(property: string): number {
  return this.afac.cround(
    this.activeHotels.reduce((sum, hotel) => sum + hotel[property], 0),
    this.info.roundOption
  );
}
```

### After (Centralized Logic):
```typescript
// PaxCalculationHelper
calculatePropertyTotals<T>(
  items: T[], 
  properties: string[], 
  roundOption: any
): Record<string, number> {
  return properties.reduce((result, property) => {
    result[property] = this.afac.cround(
      items.reduce((total, item) => total + (item[property] || 0), 0),
      roundOption
    );
    return result;
  }, {});
}

// Usage in components
const totals = this.paxHelper.calculatePropertyTotals(
  activeHotels, 
  ['per_persion', 'unit_Total', 'acc_Total'], 
  this.info.roundOption
);
```

## 🧪 Testing Strategy

### Service Unit Tests
```typescript
describe('CommissionCalculationService', () => {
  it('should calculate agent commissions correctly')
  it('should convert margin to markup accurately')
  it('should handle multiple commission tiers')
})

describe('TotalCalculationService', () => {
  it('should calculate grand totals for single quote')
  it('should calculate grand totals for multiple quotes correctly')
  it('should apply additional fees only once')
})
```

### Integration Tests
```typescript
describe('EditComponent with Services', () => {
  it('should maintain same calculation results after refactoring')
  it('should handle quote price changes consistently')
})
```

## 📈 Expected Benefits

### Code Quality
- ✅ **DRY Principle**: Eliminate duplicate calculation logic
- ✅ **Single Responsibility**: Each service has focused purpose
- ✅ **Testability**: Isolated services are easier to unit test
- ✅ **Maintainability**: Changes in one place affect all components

### Performance
- ✅ **Optimized Calculations**: Centralized logic can be optimized once
- ✅ **Caching**: Services can implement smart caching strategies
- ✅ **Memory Usage**: Reduced duplicate code footprint

### Developer Experience  
- ✅ **Consistency**: Same calculations across all components
- ✅ **Documentation**: Services are self-documenting with clear interfaces
- ✅ **Debugging**: Easier to debug calculation issues in one place
- ✅ **Extension**: New features can leverage existing calculation services

## ⚠️ Migration Considerations

### Breaking Changes
- Service injection required in components
- Method signatures may change slightly
- Some private methods become public service methods

### Backward Compatibility
- Keep existing method signatures during transition
- Use deprecation warnings before removing old methods
- Gradual migration component by component

### Rollback Plan
- Keep original methods commented out during initial deployment
- Feature flags for using new vs old calculation methods
- Quick rollback capability if issues arise

## 🎯 Success Metrics

### Code Metrics
- **Reduced LOC**: Target 20-30% reduction in component line count
- **Duplicated Code**: Target 0% duplicate calculation logic
- **Cyclomatic Complexity**: Reduced complexity in components

### Quality Metrics  
- **Test Coverage**: 90%+ coverage for calculation services
- **Bug Reduction**: Zero calculation inconsistencies between components
- **Performance**: No regression in calculation performance