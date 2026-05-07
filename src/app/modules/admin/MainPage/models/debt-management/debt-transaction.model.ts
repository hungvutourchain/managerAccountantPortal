export interface DebtTransactionItem {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  transactionType: "debt" | "credit";
  amount: number;
  transactionAt: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export interface DebtTransactionListResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: DebtTransactionItem[];
}

export interface DebtTransactionQueryParams {
  search: string;
  customerId: string;
  transactionType: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export interface CreateDebtTransactionPayload {
  customerId: string;
  transactionType: "debt" | "credit";
  amount: number;
  transactionAt: string;
  note?: string;
}

export interface UpdateDebtTransactionPayload {
  transactionType: "debt" | "credit";
  amount: number;
  transactionAt: string;
  note?: string;
}

export interface DebtTransactionAuditLogItem {
  id: string;
  action: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
  changedBy?: string;
  note?: string;
}

export interface DebtTransactionAuditLogResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: DebtTransactionAuditLogItem[];
}
