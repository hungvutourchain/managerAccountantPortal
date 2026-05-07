export interface DebtQueryParams {
  search: string;
  status: string;
  riskLevel: string;
  balanceType: string;
  agingBucket: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
}
