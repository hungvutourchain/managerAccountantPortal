import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment as env } from "environments/environment";
import { Observable } from "rxjs";
import {
  CreateDebtTransactionPayload,
  DebtAiQueryRequest,
  DebtAiQueryResponse,
  DebtTransactionAuditLogResponse,
  DebtTransactionListResponse,
  DebtTransactionQueryParams,
  UpdateDebtTransactionPayload,
} from "./models/debt-management";

@Injectable()
export class TransactionManagementService {
  private readonly baseUrl = `${env.urlOperationApi}/TransactionManagement`;

  constructor(private http: HttpClient) {}

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

    return this.http.get<DebtTransactionListResponse>(`${this.baseUrl}/transactions`, { params });
  }

  addDebtTransaction(payload: CreateDebtTransactionPayload): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/transactions`, payload);
  }

  updateDebtTransaction(transactionId: string, payload: UpdateDebtTransactionPayload): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/transactions/${transactionId}`, payload);
  }

  getDebtTransactionAuditLogs(transactionId: string, page = 1, pageSize = 50): Observable<DebtTransactionAuditLogResponse> {
    const params = new HttpParams()
      .set("page", String(page))
      .set("pageSize", String(pageSize));

    return this.http.get<DebtTransactionAuditLogResponse>(`${this.baseUrl}/transactions/${transactionId}/audit-logs`, {
      params,
    });
  }

  exportDebtCustomerExcel(customerId: string, transactionIds?: string[]): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (transactionIds && transactionIds.length > 0) {
      params = params.set("transactionIds", transactionIds.join(","));
    }

    return this.http.get(`${this.baseUrl}/customers/${customerId}/export-excel`, {
      params,
      observe: "response",
      responseType: "blob",
    });
  }

  queryDebtAi(payload: DebtAiQueryRequest): Observable<DebtAiQueryResponse> {
    return this.http.post<DebtAiQueryResponse>(`${this.baseUrl}/debt-ai/query`, payload);
  }
}