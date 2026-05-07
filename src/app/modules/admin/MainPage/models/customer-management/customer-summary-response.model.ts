export interface CustomerSummaryResponse {
  totalCustomers: number;
  activeCustomers: number;
  warningCustomers: number;
  blockedCustomers: number;
  totalDebt: number;
  totalCredit: number;
}
