import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment as env } from "environments/environment";
import { Observable } from "rxjs";
import {
  CustomerAccount,
  CustomerDebtReportExportHistoryQuery,
  CustomerDebtReportExportHistoryResponse,
  CustomerListResponse,
  CustomerQueryParams,
  CustomerDebtReportSummaryResponse,
  CustomerSummaryResponse,
} from "./models/customer-management";
import {
  CreateDebtTransactionPayload,
  DebtListResponse,
  DebtOverviewResponse,
  DebtQueryParams,
  DebtTransactionAuditLogResponse,
  DebtTransactionListResponse,
  DebtTransactionQueryParams,
  UpdateDebtTransactionPayload,
} from "./models/debt-management";

@Injectable()
export class CustomerManagementService {
  private readonly baseUrl = `${env.urlOperationApi}/CustomerManagement`;

  constructor(private http: HttpClient) {}

  getCustomers(query: CustomerQueryParams): Observable<CustomerListResponse> {
    let params = new HttpParams()
      .set("page", String(query.page))
      .set("pageSize", String(query.pageSize))
      .set("sortBy", query.sortBy)
      .set("sortDirection", query.sortDirection);

    if (query.search) {
      params = params.set("search", query.search);
    }
    if (query.status) {
      params = params.set("status", query.status);
    }
    if (query.riskLevel) {
      params = params.set("riskLevel", query.riskLevel);
    }

    return this.http.get<CustomerListResponse>(`${this.baseUrl}/customers`, {
      params,
    });
  }

  getSummary(): Observable<CustomerSummaryResponse> {
    return this.http.get<CustomerSummaryResponse>(`${this.baseUrl}/summary`);
  }

  getCustomerDebtReportSummary(status: string, riskLevel: string): Observable<CustomerDebtReportSummaryResponse> {
    let params = new HttpParams();

    if (status) {
      params = params.set("status", status);
    }

    if (riskLevel) {
      params = params.set("riskLevel", riskLevel);
    }

    return this.http.get<CustomerDebtReportSummaryResponse>(`${this.baseUrl}/reports/customer-debt-summary`, { params });
  }

  getCustomerDebtReportSummaryWithDateRange(
    status: string,
    riskLevel: string,
    fromDate?: string,
    toDate?: string,
  ): Observable<CustomerDebtReportSummaryResponse> {
    let params = new HttpParams();

    if (status) {
      params = params.set("status", status);
    }

    if (riskLevel) {
      params = params.set("riskLevel", riskLevel);
    }

    if (fromDate) {
      params = params.set("fromDate", fromDate);
    }

    if (toDate) {
      params = params.set("toDate", toDate);
    }

    return this.http.get<CustomerDebtReportSummaryResponse>(`${this.baseUrl}/reports/customer-debt-summary`, { params });
  }

  getCustomerDebtReportDetails(query: {
    search?: string;
    status: string;
    riskLevel: string;
    fromDate?: string;
    toDate?: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortDirection: "asc" | "desc";
  }): Observable<DebtListResponse> {
    let params = new HttpParams()
      .set("page", String(query.page))
      .set("pageSize", String(query.pageSize))
      .set("sortBy", query.sortBy)
      .set("sortDirection", query.sortDirection)
      .set("status", query.status)
      .set("riskLevel", query.riskLevel);

    if (query.search?.trim()) {
      params = params.set("search", query.search.trim());
    }

    if (query.fromDate) {
      params = params.set("fromDate", query.fromDate);
    }

    if (query.toDate) {
      params = params.set("toDate", query.toDate);
    }

    return this.http.get<DebtListResponse>(`${this.baseUrl}/reports/customer-debt-details`, { params });
  }

  exportCustomerDebtReport(query: {
    search?: string;
    status: string;
    riskLevel: string;
    fromDate?: string;
    toDate?: string;
    sortBy: string;
    sortDirection: "asc" | "desc";
  }): Observable<HttpResponse<Blob>> {
    let params = new HttpParams()
      .set("status", query.status)
      .set("riskLevel", query.riskLevel)
      .set("sortBy", query.sortBy)
      .set("sortDirection", query.sortDirection);

    if (query.search?.trim()) {
      params = params.set("search", query.search.trim());
    }

    if (query.fromDate) {
      params = params.set("fromDate", query.fromDate);
    }

    if (query.toDate) {
      params = params.set("toDate", query.toDate);
    }

    return this.http.get(`${this.baseUrl}/reports/customer-debt-export`, {
      params,
      observe: "response",
      responseType: "blob",
    });
  }

  getCustomerDebtReportExportHistory(query: CustomerDebtReportExportHistoryQuery): Observable<CustomerDebtReportExportHistoryResponse> {
    let params = new HttpParams()
      .set("page", String(query.page))
      .set("pageSize", String(query.pageSize))
      .set("sortBy", query.sortBy)
      .set("sortDirection", query.sortDirection);

    if (query.search?.trim()) {
      params = params.set("search", query.search.trim());
    }

    if (query.exportedBy?.trim()) {
      params = params.set("exportedBy", query.exportedBy.trim());
    }

    if (query.fromDate) {
      params = params.set("fromDate", query.fromDate);
    }

    if (query.toDate) {
      params = params.set("toDate", query.toDate);
    }

    return this.http.get<CustomerDebtReportExportHistoryResponse>(`${this.baseUrl}/reports/customer-debt-export-history`, { params });
  }

  downloadCustomerDebtReportExportHistory(historyId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/reports/customer-debt-export-history/${historyId}/download`, {
      observe: "response",
      responseType: "blob",
    });
  }

  getAccountTypes(search = "", includeAll = false, maxItems = 200): Observable<Array<{
    value: string;
    label: string;
    accountType?: string;
    accountName?: string;
    accountNameLocal?: string;
    balanceSide?: string;
  }>> {
    let params = new HttpParams()
      .set("includeAll", String(includeAll))
      .set("maxItems", String(maxItems));

    if (search && search.trim()) {
      params = params.set("search", search.trim());
    }

    return this.http.get<Array<{
      value: string;
      label: string;
      accountType?: string;
      accountName?: string;
      accountNameLocal?: string;
      balanceSide?: string;
    }>>(`${this.baseUrl}/account-types`, { params });
  }

  getAccountTypeConfigs(
    search = "",
    page = 1,
    pageSize = 20,
  ): Observable<{
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    items: Array<{
      id: string;
      accountType: string;
      accountName?: string;
      accountNameLocal?: string;
      updatedAt?: string;
    }>;
  }> {
    let params = new HttpParams()
      .set("page", String(page))
      .set("pageSize", String(pageSize));

    if (search && search.trim()) {
      params = params.set("search", search.trim());
    }

    return this.http.get<{
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      items: Array<{
        id: string;
        accountType: string;
        accountName?: string;
        accountNameLocal?: string;
        balanceSide?: string;
        updatedAt?: string;
      }>;
    }>(`${this.baseUrl}/account-types/manage`, { params });
  }

  upsertAccountTypeConfig(payload: {
    id?: string;
    accountType: string;
    accountName?: string;
    accountNameLocal?: string;
    balanceSide?: string;
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/account-types`, payload);
  }

  deleteAccountTypeConfig(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/account-types/${id}`);
  }

  upsertCustomer(payload: CustomerAccount): Observable<CustomerAccount> {
    return this.http.post<CustomerAccount>(`${this.baseUrl}/customers`, payload);
  }

  deleteCustomer(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/customers/${id}`);
  }

  getDebtOverview(status: string, riskLevel: string): Observable<DebtOverviewResponse> {
    let params = new HttpParams();

    if (status) {
      params = params.set("status", status);
    }

    if (riskLevel) {
      params = params.set("riskLevel", riskLevel);
    }

    return this.http.get<DebtOverviewResponse>(`${this.baseUrl}/debt/overview`, { params });
  }

  getDebtList(query: DebtQueryParams): Observable<DebtListResponse> {
    let params = new HttpParams()
      .set("page", String(query.page))
      .set("pageSize", String(query.pageSize))
      .set("sortBy", query.sortBy)
      .set("sortDirection", query.sortDirection)
      .set("balanceType", query.balanceType)
      .set("agingBucket", query.agingBucket);

    if (query.search) {
      params = params.set("search", query.search);
    }

    if (query.status) {
      params = params.set("status", query.status);
    }

    if (query.riskLevel) {
      params = params.set("riskLevel", query.riskLevel);
    }

    return this.http.get<DebtListResponse>(`${this.baseUrl}/debt/list`, { params });
  }

  getDebtTransactions(query: DebtTransactionQueryParams): Observable<DebtTransactionListResponse> {
    let params = new HttpParams()
      .set("page", String(query.page))
      .set("pageSize", String(query.pageSize))
      .set("sortBy", query.sortBy)
      .set("sortDirection", query.sortDirection);

    if (query.customerId && query.customerId !== "undefined" && query.customerId !== "null") {
      params = params.set("customerId", query.customerId);
    }

    if (query.search) {
      params = params.set("search", query.search);
    }

    if (query.transactionType) {
      params = params.set("transactionType", query.transactionType);
    }

    return this.http.get<DebtTransactionListResponse>(`${this.baseUrl}/debt/transactions`, { params });
  }

  addDebtTransaction(payload: CreateDebtTransactionPayload): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/debt/transactions`, payload);
  }

  updateDebtTransaction(transactionId: string, payload: UpdateDebtTransactionPayload): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/debt/transactions/${transactionId}`, payload);
  }

  getDebtTransactionAuditLogs(transactionId: string, page = 1, pageSize = 50): Observable<DebtTransactionAuditLogResponse> {
    const params = new HttpParams()
      .set("page", String(page))
      .set("pageSize", String(pageSize));

    return this.http.get<DebtTransactionAuditLogResponse>(`${this.baseUrl}/debt/transactions/${transactionId}/audit-logs`, {
      params,
    });
  }

  exportDebtCustomerExcel(customerId: string, transactionIds?: string[]): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (transactionIds && transactionIds.length > 0) {
      params = params.set("transactionIds", transactionIds.join(","));
    }

    return this.http.get(`${this.baseUrl}/debt/customers/${customerId}/export-excel`, {
      params,
      observe: "response",
      responseType: "blob",
    });
  }

  getCustomerAuditLogs(customerId: string, page = 1, pageSize = 50): Observable<{
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    items: Array<{
      id: string;
      action: string;
      field: string;
      oldValue?: string;
      newValue?: string;
      changedAt: string;
      changedBy?: string;
      note?: string;
    }>;
  }> {
    const params = new HttpParams()
      .set("page", String(page))
      .set("pageSize", String(pageSize));

    return this.http.get<{
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      items: Array<{
        id: string;
        action: string;
        field: string;
        oldValue?: string;
        newValue?: string;
        changedAt: string;
        changedBy?: string;
        note?: string;
      }>;
    }>(`${this.baseUrl}/customers/${customerId}/audit-logs`, { params });
  }
}
