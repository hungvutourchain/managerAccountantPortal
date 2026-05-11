import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment as env } from "environments/environment";
import { Observable } from "rxjs";
import {
  CreateDebtTransactionPayload,
  DebtCustomerExcelExportHistoryQuery,
  DebtCustomerExcelExportHistoryResponse,
  DebtTransactionAttachmentResponse,
  DebtTransactionMutationResponse,
  DebtAiQueryRequest,
  DebtAiQueryResponse,
  DebtCustomerExportProgressResponse,
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

  addDebtTransaction(payload: CreateDebtTransactionPayload): Observable<DebtTransactionMutationResponse> {
    return this.http.post<DebtTransactionMutationResponse>(`${this.baseUrl}/transactions`, payload);
  }

  updateDebtTransaction(transactionId: string, payload: UpdateDebtTransactionPayload): Observable<DebtTransactionMutationResponse> {
    return this.http.put<DebtTransactionMutationResponse>(`${this.baseUrl}/transactions/${transactionId}`, payload);
  }

  uploadDebtTransactionAttachments(transactionId: string, files: File[]): Observable<DebtTransactionAttachmentResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file, file.name));

    return this.http.post<DebtTransactionAttachmentResponse>(`${this.baseUrl}/transactions/${transactionId}/attachments`, formData);
  }

  deleteDebtTransactionAttachment(transactionId: string, attachmentId: string): Observable<DebtTransactionAttachmentResponse> {
    return this.http.delete<DebtTransactionAttachmentResponse>(`${this.baseUrl}/transactions/${transactionId}/attachments/${attachmentId}`);
  }

  downloadDebtTransactionAttachment(transactionId: string, attachmentId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/transactions/${transactionId}/attachments/${attachmentId}/download`, {
      observe: "response",
      responseType: "blob",
    });
  }

  getDebtTransactionAuditLogs(transactionId: string, page = 1, pageSize = 50): Observable<DebtTransactionAuditLogResponse> {
    const params = new HttpParams()
      .set("page", String(page))
      .set("pageSize", String(pageSize));

    return this.http.get<DebtTransactionAuditLogResponse>(`${this.baseUrl}/transactions/${transactionId}/audit-logs`, {
      params,
    });
  }

  exportDebtCustomerExcel(customerId: string, transactionIds?: string[], exportRequestId?: string): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (transactionIds && transactionIds.length > 0) {
      params = params.set("transactionIds", transactionIds.join(","));
    }
    if (exportRequestId) {
      params = params.set("exportRequestId", exportRequestId);
    }

    return this.http.get(`${this.baseUrl}/customers/${customerId}/export-excel`, {
      params,
      observe: "response",
      responseType: "blob",
    });
  }

  exportDebtCustomerPdf(customerId: string, transactionIds?: string[], exportRequestId?: string): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (transactionIds && transactionIds.length > 0) {
      params = params.set("transactionIds", transactionIds.join(","));
    }
    if (exportRequestId) {
      params = params.set("exportRequestId", exportRequestId);
    }

    return this.http.get(`${this.baseUrl}/customers/${customerId}/export-pdf`, {
      params,
      observe: "response",
      responseType: "blob",
    });
  }

  getDebtCustomerExportProgress(customerId: string, requestId: string): Observable<DebtCustomerExportProgressResponse> {
    return this.http.get<DebtCustomerExportProgressResponse>(`${this.baseUrl}/customers/${customerId}/export-progress/${requestId}`);
  }

  getDebtCustomerExcelExportHistory(
    customerId: string,
    query: DebtCustomerExcelExportHistoryQuery,
  ): Observable<DebtCustomerExcelExportHistoryResponse> {
    const params = new HttpParams()
      .set("page", String(query.page))
      .set("pageSize", String(query.pageSize))
      .set("sortBy", query.sortBy)
      .set("sortDirection", query.sortDirection);

    let finalParams = params;
    if (query.search?.trim()) {
      finalParams = finalParams.set("search", query.search.trim());
    }
    if (query.exportedBy?.trim()) {
      finalParams = finalParams.set("exportedBy", query.exportedBy.trim());
    }
    if (query.fromDate) {
      finalParams = finalParams.set("fromDate", query.fromDate);
    }
    if (query.toDate) {
      finalParams = finalParams.set("toDate", query.toDate);
    }

    return this.http.get<DebtCustomerExcelExportHistoryResponse>(`${this.baseUrl}/customers/${customerId}/export-excel-history`, {
      params: finalParams,
    });
  }

  downloadDebtCustomerExcelExportHistory(customerId: string, historyId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/customers/${customerId}/export-excel-history/${historyId}/download`, {
      observe: "response",
      responseType: "blob",
    });
  }

  queryDebtAi(payload: DebtAiQueryRequest): Observable<DebtAiQueryResponse> {
    return this.http.post<DebtAiQueryResponse>(`${this.baseUrl}/debt-ai/query`, payload);
  }
}