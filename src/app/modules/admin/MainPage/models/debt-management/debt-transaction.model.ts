export interface DebtTransactionAttachmentItem {
  id: string;
  fileName: string;
  storedFileName?: string;
  relativePath?: string;
  contentType?: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface DebtTransactionItem {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  transactionType: "debt" | "credit";
  amount: number;
  transactionAt: string;
  contractCode?: string;
  note?: string;
  attachments?: DebtTransactionAttachmentItem[];
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
  contractCode?: string;
  note?: string;
}

export interface UpdateDebtTransactionPayload {
  customerId?: string;
  transactionType: "debt" | "credit";
  amount: number;
  transactionAt: string;
  contractCode?: string;
  note?: string;
}

export interface DebtTransactionMutationResponse {
  success: boolean;
  customerId: string;
  debtAmount?: number;
  creditAmount?: number;
  netBalance?: number;
  transaction: DebtTransactionItem;
}

export interface DebtTransactionAttachmentResponse {
  success: boolean;
  attachments: DebtTransactionAttachmentItem[];
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

export interface DebtCustomerExcelExportHistoryItem {
  id: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  fileName: string;
  storedFileName?: string;
  relativePath?: string;
  contentType?: string;
  size: number;
  periodFrom?: string;
  periodTo?: string;
  transactionCount: number;
  exportedAt: string;
  exportedBy?: string;
}

export interface DebtCustomerExcelExportHistoryResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: DebtCustomerExcelExportHistoryItem[];
}

export interface DebtCustomerExcelExportHistoryQuery {
  search: string;
  exportedBy: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
  sortBy: "exportedAt" | "fileName" | "size" | "exportedBy";
  sortDirection: "asc" | "desc";
}
