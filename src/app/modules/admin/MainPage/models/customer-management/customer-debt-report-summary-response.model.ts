import { DebtOverviewResponse } from "../debt-management";
import { CustomerSummaryResponse } from "./customer-summary-response.model";

export interface CustomerDebtReportSummaryResponse {
  generatedAt: string;
  filters: {
    status: string;
    riskLevel: string;
  };
  customerSummary: CustomerSummaryResponse;
  debtOverview: DebtOverviewResponse;
}

export interface CustomerDebtReportExportHistoryItem {
  id: string;
  fileName: string;
  storedFileName?: string;
  relativePath?: string;
  contentType?: string;
  size: number;
  status?: string;
  riskLevel?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
  fromDate?: string;
  toDate?: string;
  recordCount: number;
  exportedAt: string;
  exportedBy?: string;
}

export interface CustomerDebtReportExportHistoryQuery {
  search: string;
  exportedBy: string;
  fromDate: string;
  toDate: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export interface CustomerDebtReportExportHistoryResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: CustomerDebtReportExportHistoryItem[];
}