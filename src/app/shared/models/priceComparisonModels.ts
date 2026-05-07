/**
 * Price Comparison DTOs
 * These interfaces match the C# DTOs from the backend API
 */

/**
 * Represents a single service price change
 */
export interface ServicePriceChangeDto {
  serviceId: string;
  serviceName: string;
  category: string;
  date: string;
  day: number;
  
  // Original prices
  originalPrice?: number;
  originalPriceUnit?: number;
  originalShareroom?: number;
  originalSglroom?: number;
  
  // New prices after retrieve
  newPrice?: number;
  newPriceUnit?: number;
  newShareroom?: number;
  newSglroom?: number;
  
  // Calculated differences
  priceDifference?: number;
  priceUnitDifference?: number;
  shareroomDifference?: number;
  sglroomDifference?: number;
  
  // Percentage changes
  priceChangePercentage?: number;
  priceUnitChangePercentage?: number;
  shareroomChangePercentage?: number;
  sglroomChangePercentage?: number;
  
  // Status
  status: 'increased' | 'decreased' | 'unchanged';
  hasSignificantChange: boolean;
}

/**
 * Summary of price changes
 */
export interface PriceComparisonSummaryDto {
  totalServices: number;
  servicesWithChanges: number;
  servicesIncreased: number;
  servicesDecreased: number;
  servicesUnchanged: number;
  
  totalOriginalAmount: number;
  totalNewAmount: number;
  totalDifference: number;
  totalChangePercentage: number;
  
  currency: string;
}

/**
 * Main response from RetrieveTourServicesWithComparison API
 */
export interface RetrievePriceComparisonResponse {
  success: boolean;
  message?: string;
  
  // Core comparison data
  tourId: string;
  tourCode: string;
  retrieveDate: string;
  currency: string;
  
  // Service changes
  serviceChanges: ServicePriceChangeDto[];
  
  // Summary
  summary: PriceComparisonSummaryDto;
  
  // Grouped data for easy display
  changesByCategory?: { [category: string]: ServicePriceChangeDto[] };
  changesByDay?: { [day: number]: ServicePriceChangeDto[] };
  changesByStatus?: {
    increased: ServicePriceChangeDto[];
    decreased: ServicePriceChangeDto[];
    unchanged: ServicePriceChangeDto[];
  };
}
