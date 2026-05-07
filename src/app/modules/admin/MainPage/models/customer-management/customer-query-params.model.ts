export interface CustomerQueryParams {
  search?: string;
  status?: string;
  riskLevel?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
}
