import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { CustomerManagementService } from "./customer-management.service";
import {
  CustomerDebtReportExportHistoryItem,
  CustomerDebtReportExportHistoryQuery,
  CustomerDebtReportSummaryResponse,
  CustomerSummaryResponse,
} from "./models/customer-management";
import { DebtItem, DebtListResponse, DebtOverviewResponse, DebtTopDebtor } from "./models/debt-management";

@Component({
  standalone: false,
  selector: "app-report-center",
  templateUrl: "./report-center.component.html",
  styleUrls: ["./report-center.component.scss"],
})
export class ReportCenterComponent implements OnInit {
  readonly optionFields = { text: "text", value: "value" };
  readonly reportDateFormat = "dd/MM/yyyy";
  readonly loadingSkeletonRows = [1, 2, 3];
  readonly statusOptions = [
    { text: "All statuses / Tất cả", value: "all" },
    { text: "Active / Hoạt động", value: "active" },
    { text: "Blocked / Tạm khóa", value: "blocked" },
  ];
  readonly riskOptions = [
    { text: "All risk levels / Tất cả", value: "all" },
    { text: "Normal / Bình thường", value: "normal" },
    { text: "Warning / Cảnh báo", value: "warning" },
    { text: "Critical / Nghiêm trọng", value: "critical" },
  ];

  customerSummary: CustomerSummaryResponse = {
    totalCustomers: 0,
    activeCustomers: 0,
    warningCustomers: 0,
    blockedCustomers: 0,
    totalDebt: 0,
    totalCredit: 0,
  };

  debtOverview: DebtOverviewResponse = {
    totalReceivable: 0,
    totalPayable: 0,
    netExposure: 0,
    highRiskExposure: 0,
    customerCount: 0,
    debtorCount: 0,
    creditorCount: 0,
    agingBuckets: [],
    topDebtors: [],
  };

  filters = {
    status: "all",
    riskLevel: "all",
    fromDate: "",
    toDate: "",
    search: "",
  };

  detailReport: DebtListResponse = {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    items: [],
  };

  detailQuery = {
    page: 1,
    pageSize: 10,
    sortBy: "netBalance",
    sortDirection: "desc" as "asc" | "desc",
  };

  loading = false;
  exporting = false;
  lastRefreshedAt: string | null = null;
  reportMeta: CustomerDebtReportSummaryResponse["filters"] | null = null;
  errorMessage = "";
  reportFromDate: Date | null = null;
  reportToDate: Date | null = null;
  showExportHistoryDialog = false;
  exportHistoryLoading = false;
  exportHistoryErrorMessage = "";
  exportHistoryItems: CustomerDebtReportExportHistoryItem[] = [];
  exportHistoryDownloadingIds: string[] = [];
  exportHistoryFromDate: Date | null = null;
  exportHistoryToDate: Date | null = null;

  detailPageSizeOptions = [10, 20, 50, 100];
  exportHistoryPager = {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  };

  exportHistoryQuery: CustomerDebtReportExportHistoryQuery = {
    search: "",
    exportedBy: "",
    fromDate: "",
    toDate: "",
    page: 1,
    pageSize: 10,
    sortBy: "exportedAt",
    sortDirection: "desc",
  };

  reportCards = [
    {
      title: "Customer Summary / Tổng quan khách hàng",
      description: "Run the customer health snapshot and balance overview.",
      action: "Run Customer Report / Chạy báo cáo khách hàng",
      target: "customer",
    },
    {
      title: "Debt Overview / Tổng quan công nợ",
      description: "Refresh receivable, payable, aging, and top debtor ranking.",
      action: "Run Debt Report / Chạy báo cáo công nợ",
      target: "debt",
    },
    {
      title: "Export History / Lịch sử export",
      description: "Review and re-download previously exported report files.",
      action: "Open Report History / Mở lịch sử báo cáo",
      target: "report-history",
    },
  ];

  constructor(
    private customerManagementService: CustomerManagementService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.runReport();
  }

  runReport(): void {
    if (!this.hasValidDateRange()) {
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    forkJoin({
      summary: this.customerManagementService.getCustomerDebtReportSummaryWithDateRange(
        this.filters.status,
        this.filters.riskLevel,
        this.filters.fromDate || undefined,
        this.filters.toDate || undefined,
      ),
      details: this.customerManagementService.getCustomerDebtReportDetails({
        search: this.filters.search,
        status: this.filters.status,
        riskLevel: this.filters.riskLevel,
        fromDate: this.filters.fromDate || undefined,
        toDate: this.filters.toDate || undefined,
        page: this.detailQuery.page,
        pageSize: this.detailQuery.pageSize,
        sortBy: this.detailQuery.sortBy,
        sortDirection: this.detailQuery.sortDirection,
      }),
    }).subscribe({
      next: ({ summary, details }) => {
        this.customerSummary = summary.customerSummary;
        this.debtOverview = summary.debtOverview;
        this.reportMeta = summary.filters;
        this.detailReport = details;
        this.lastRefreshedAt = new Date(summary.generatedAt).toLocaleString("vi-VN");
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "Failed to load report data. / Không tải được dữ liệu báo cáo.";
        this.customerSummary = {
          totalCustomers: 0,
          activeCustomers: 0,
          warningCustomers: 0,
          blockedCustomers: 0,
          totalDebt: 0,
          totalCredit: 0,
        };
        this.debtOverview = {
          totalReceivable: 0,
          totalPayable: 0,
          netExposure: 0,
          highRiskExposure: 0,
          customerCount: 0,
          debtorCount: 0,
          creditorCount: 0,
          agingBuckets: [],
          topDebtors: [],
        };
        this.detailReport = {
          page: 1,
          pageSize: this.detailQuery.pageSize,
          totalItems: 0,
          totalPages: 0,
          items: [],
        };
        this.reportMeta = null;
        this.loading = false;
      },
    });
  }

  resetFilters(): void {
    this.filters = {
      status: "all",
      riskLevel: "all",
      fromDate: "",
      toDate: "",
      search: "",
    };
    this.reportFromDate = null;
    this.reportToDate = null;
    this.detailQuery.page = 1;
    this.runReport();
  }

  applyFilters(): void {
    this.detailQuery.page = 1;
    this.runReport();
  }

  exportReportExcel(): void {
    if (this.exporting) {
      return;
    }

    if (!this.hasValidDateRange()) {
      return;
    }

    this.exporting = true;
    this.errorMessage = "";
    this.customerManagementService.exportCustomerDebtReport({
      search: this.filters.search,
      status: this.filters.status,
      riskLevel: this.filters.riskLevel,
      fromDate: this.filters.fromDate || undefined,
      toDate: this.filters.toDate || undefined,
      sortBy: this.detailQuery.sortBy,
      sortDirection: this.detailQuery.sortDirection,
    }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.exporting = false;
          return;
        }

        const contentDisposition = response.headers.get("content-disposition") || "";
        const fileNameMatch = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(contentDisposition);
        const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1].replace(/\"/g, "")) : "customer-debt-report.xlsx";
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => {
        this.errorMessage = "Failed to export report. / Không xuất được báo cáo.";
        this.exporting = false;
      },
    });
  }

  changePageSize(pageSize: number): void {
    const normalized = Number(pageSize || 10);
    this.detailQuery.pageSize = normalized > 0 ? normalized : 10;
    this.detailQuery.page = 1;
    this.runReport();
  }

  toggleSort(sortBy: string): void {
    if (this.detailQuery.sortBy === sortBy) {
      this.detailQuery.sortDirection = this.detailQuery.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.detailQuery.sortBy = sortBy;
      this.detailQuery.sortDirection = sortBy === "name" ? "asc" : "desc";
    }

    this.detailQuery.page = 1;
    this.runReport();
  }

  getSortIndicator(sortBy: string): string {
    if (this.detailQuery.sortBy !== sortBy) {
      return "";
    }

    return this.detailQuery.sortDirection === "asc" ? "↑" : "↓";
  }

  goToPage(page: number): void {
    if (page < 1 || page > Math.max(1, this.detailReport.totalPages || 1) || page === this.detailQuery.page) {
      return;
    }

    this.detailQuery.page = page;
    this.runReport();
  }

  formatDate(value?: string): string {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-GB");
  }

  getBalanceTone(item: DebtItem): string {
    if (item.netBalance > 0) {
      return "is-positive";
    }

    if (item.netBalance < 0) {
      return "is-negative";
    }

    return "is-neutral";
  }

  openTarget(target: string): void {
    if (target === "customer") {
      this.router.navigate(["/main-page/customer-management"]);
      return;
    }

    if (target === "debt") {
      this.router.navigate(["/main-page/debt-management"]);
      return;
    }

    if (target === "debt-management") {
      this.router.navigate(["/main-page/debt-management"], { fragment: "export-history" });
      return;
    }

    if (target === "report-history") {
      this.openReportExportHistory();
    }
  }

  openReportExportHistory(): void {
    this.showExportHistoryDialog = true;
    this.exportHistoryQuery.page = 1;
    this.loadReportExportHistory();
  }

  closeReportExportHistory(): void {
    this.showExportHistoryDialog = false;
    this.exportHistoryLoading = false;
    this.exportHistoryErrorMessage = "";
    this.exportHistoryItems = [];
    this.exportHistoryDownloadingIds = [];
    this.exportHistoryFromDate = null;
    this.exportHistoryToDate = null;
    this.exportHistoryQuery = {
      search: "",
      exportedBy: "",
      fromDate: "",
      toDate: "",
      page: 1,
      pageSize: 10,
      sortBy: "exportedAt",
      sortDirection: "desc",
    };
    this.exportHistoryPager = {
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    };
  }

  applyReportHistoryFilters(): void {
    this.exportHistoryQuery.page = 1;
    this.loadReportExportHistory();
  }

  changeReportHistoryPage(page: number): void {
    if (page < 1 || page > Math.max(1, this.exportHistoryPager.totalPages || 1) || page === this.exportHistoryQuery.page) {
      return;
    }

    this.exportHistoryQuery.page = page;
    this.loadReportExportHistory();
  }

  downloadReportHistoryItem(item: CustomerDebtReportExportHistoryItem): void {
    const historyId = String(item?.id || "").trim();
    if (!historyId || this.exportHistoryDownloadingIds.includes(historyId)) {
      return;
    }

    this.exportHistoryDownloadingIds = [...this.exportHistoryDownloadingIds, historyId];
    this.customerManagementService.downloadCustomerDebtReportExportHistory(historyId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          return;
        }

        const contentDisposition = response.headers.get("content-disposition") || "";
        const fileNameMatch = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(contentDisposition);
        const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1].replace(/\"/g, "")) : item.fileName || "customer-debt-report.xlsx";
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.exportHistoryErrorMessage = "Failed to download report history file. / Không tải được file lịch sử báo cáo.";
      },
      complete: () => {
        this.exportHistoryDownloadingIds = this.exportHistoryDownloadingIds.filter((id) => id !== historyId);
      },
    });
  }

  onExportHistoryFromDateChange(event: { value?: Date | null }): void {
    const value = event?.value instanceof Date ? event.value : null;
    this.exportHistoryFromDate = value;
    this.exportHistoryQuery.fromDate = this.formatDateQuery(value);
  }

  onExportHistoryToDateChange(event: { value?: Date | null }): void {
    const value = event?.value instanceof Date ? event.value : null;
    this.exportHistoryToDate = value;
    this.exportHistoryQuery.toDate = this.formatDateQuery(value);
  }

  onReportFromDateChange(event: { value?: Date | null }): void {
    const value = event?.value instanceof Date ? event.value : null;
    this.reportFromDate = value;
    this.filters.fromDate = this.formatDateQuery(value);
  }

  onReportToDateChange(event: { value?: Date | null }): void {
    const value = event?.value instanceof Date ? event.value : null;
    this.reportToDate = value;
    this.filters.toDate = this.formatDateQuery(value);
  }

  openCustomerLedger(customerId?: string): void {
    const normalizedCustomerId = this.normalizeCustomerId(customerId);
    if (!normalizedCustomerId) {
      this.errorMessage = "Missing customer ID, cannot open ledger. / Thiếu ID khách hàng nên không mở được sổ chi tiết.";
      this.router.navigate(["/main-page/debt-management"], {
        queryParams: {
          tab: "transactions",
        },
      });
      return;
    }

    this.errorMessage = "";

    this.router.navigate(["/main-page/debt-management"], {
      queryParams: {
        tab: "transactions",
        customerId: normalizedCustomerId,
      },
    });
  }

  openCustomerExportHistory(customerId?: string): void {
    const normalizedCustomerId = this.normalizeCustomerId(customerId);
    if (!normalizedCustomerId) {
      this.errorMessage = "Missing customer ID, cannot open export history. / Thiếu ID khách hàng nên không mở được lịch sử export.";
      this.router.navigate(["/main-page/debt-management"], {
        queryParams: {
          tab: "transactions",
        },
      });
      return;
    }

    this.errorMessage = "";

    this.router.navigate(["/main-page/debt-management"], {
      queryParams: {
        tab: "transactions",
        customerId: normalizedCustomerId,
      },
      fragment: "export-history",
    });
  }

  openCustomerExcelPreview(customerId?: string): void {
    const normalizedCustomerId = this.normalizeCustomerId(customerId);
    if (!normalizedCustomerId) {
      this.errorMessage = "Missing customer ID, cannot open Excel preview. / Thiếu ID khách hàng nên không mở được xem trước Excel.";
      this.router.navigate(["/main-page/debt-management"], {
        queryParams: {
          tab: "transactions",
        },
      });
      return;
    }

    this.errorMessage = "";

    this.router.navigate(["/main-page/debt-management"], {
      queryParams: {
        tab: "transactions",
        customerId: normalizedCustomerId,
      },
      fragment: "excel-preview",
    });
  }

  trackTopDebtor(index: number, item: DebtTopDebtor): string {
    return item?.id || String(index);
  }

  getStatusBadgeClass(value?: string): string {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "active") {
      return "badge badge-status-active";
    }

    if (normalized === "blocked") {
      return "badge badge-status-blocked";
    }

    return "badge";
  }

  getRiskBadgeClass(value?: string): string {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "critical") {
      return "badge badge-risk-critical";
    }

    if (normalized === "warning") {
      return "badge badge-risk-warning";
    }

    if (normalized === "normal") {
      return "badge badge-risk-normal";
    }

    return "badge";
  }

  getAgingShare(bucketAmount: number): number {
    const total = this.debtOverview.agingBuckets.reduce((sum, bucket) => sum + Number(bucket.amount || 0), 0);
    if (!total) {
      return 0;
    }

    return Math.round((Number(bucketAmount || 0) / total) * 100);
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  formatSignedAmount(value: number): string {
    const amount = Number(value || 0);
    const formatted = this.formatAmount(Math.abs(amount));
    return amount < 0 ? `-${formatted}` : formatted;
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("vi-VN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatFileSize(value: number): string {
    const size = Number(value || 0);
    if (size <= 0) {
      return "0 B";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    const kb = size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }

    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }

  private hasValidDateRange(): boolean {
    if (!this.filters.fromDate || !this.filters.toDate) {
      this.errorMessage = "";
      return true;
    }

    if (this.filters.fromDate <= this.filters.toDate) {
      this.errorMessage = "";
      return true;
    }

    this.errorMessage = "From Date must be earlier than or equal to To Date. / Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.";
    return false;
  }

  private loadReportExportHistory(): void {
    this.exportHistoryLoading = true;
    this.exportHistoryErrorMessage = "";
    this.customerManagementService.getCustomerDebtReportExportHistory(this.exportHistoryQuery).subscribe({
      next: (response) => {
        this.exportHistoryItems = response.items || [];
        this.exportHistoryPager.page = response.page || this.exportHistoryQuery.page;
        this.exportHistoryPager.pageSize = response.pageSize || this.exportHistoryQuery.pageSize;
        this.exportHistoryPager.totalItems = response.totalItems || 0;
        this.exportHistoryPager.totalPages = response.totalPages || 0;
      },
      error: () => {
        this.exportHistoryItems = [];
        this.exportHistoryPager.totalItems = 0;
        this.exportHistoryPager.totalPages = 0;
        this.exportHistoryErrorMessage = "Failed to load report export history. / Không tải được lịch sử export báo cáo.";
      },
      complete: () => {
        this.exportHistoryLoading = false;
      },
    });
  }

  private formatDateQuery(value: Date | null): string {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private normalizeCustomerId(value?: unknown): string {
    if (!value) {
      return "";
    }

    if (typeof value === "object") {
      const objectValue = value as Record<string, unknown>;
      const nestedCandidates: unknown[] = [
        objectValue.$oid,
        objectValue.oid,
        objectValue.id,
        objectValue.Id,
      ];

      for (const nested of nestedCandidates) {
        const normalizedNested = this.normalizeCustomerId(nested);
        if (normalizedNested) {
          return normalizedNested;
        }
      }

      return "";
    }

    const normalized = String(value).trim();
    if (!normalized || normalized === "undefined" || normalized === "null" || normalized === "[object Object]") {
      return "";
    }

    return normalized;
  }
}