import { Component, OnInit } from "@angular/core";
import { CustomerManagementService } from "./customer-management.service";
import {
  CreateDebtTransactionPayload,
  DebtTransactionAuditLogItem,
  DebtItem,
  DebtOverviewResponse,
  DebtTransactionItem,
  DebtTransactionQueryParams,
  UpdateDebtTransactionPayload,
} from "./models/debt-management";
import { CustomerAccount } from "./models/customer-management";

@Component({
  standalone: false,
  selector: "app-debt-management",
  templateUrl: "./debt-management.component.html",
  styleUrls: ["./debt-management.component.scss"],
})
export class DebtManagementComponent implements OnInit {
  activeTab: "overview" | "transactions" = "overview";
  loading = false;
  overviewLoading = false;
  transactionLoading = false;
  savingTransaction = false;
  showTransactionEditor = false;
  showTransactionAuditDialog = false;
  showExcelDialog = false;
  transactionAuditLoading = false;
  excelLoading = false;
  transactionAuditErrorMessage = "";
  excelErrorMessage = "";
  editingTransactionId: string | null = null;
  selectedTransaction: DebtTransactionItem | null = null;
  selectedExcelDebtItem: DebtItem | null = null;

  overview: DebtOverviewResponse = {
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

  debtItems: DebtItem[] = [];
  customerOptions: CustomerAccount[] = [];
  transactions: DebtTransactionItem[] = [];
  transactionAuditLogs: DebtTransactionAuditLogItem[] = [];
  excelTransactions: DebtTransactionItem[] = [];
  transactionCountByCustomerId: Record<string, number> = {};

  query = {
    search: "",
    status: "all",
    riskLevel: "all",
    balanceType: "all",
    agingBucket: "all",
    page: 1,
    pageSize: 10,
    sortBy: "netBalance",
    sortDirection: "desc" as "asc" | "desc",
  };

  pager = {
    totalItems: 0,
    totalPages: 0,
  };

  transactionQuery: DebtTransactionQueryParams = {
    search: "",
    customerId: "",
    transactionType: "all",
    page: 1,
    pageSize: 10,
    sortBy: "transactionAt",
    sortDirection: "desc",
  };

  transactionPager = {
    totalItems: 0,
    totalPages: 0,
  };

  transactionCustomerOptions: Array<{ text: string; value: string }> = [];
  transactionFormCustomerOptions: Array<{ text: string; value: string }> = [];

  transactionForm = {
    customerId: "",
    transactionType: "debt" as "debt" | "credit",
    amount: 0,
    transactionAt: this.getCurrentDateTime(),
    note: "",
  };

  readonly optionFields = { text: "label", value: "value" };

  statusOptions = [
    { label: "All statuses (Tất cả trạng thái)", value: "all" },
    { label: "Active (Đang hoạt động)", value: "active" },
    { label: "Blocked (Tạm khóa)", value: "blocked" },
  ];

  riskOptions = [
    { label: "All risk levels (Tất cả rủi ro)", value: "all" },
    { label: "Normal (Bình thường)", value: "normal" },
    { label: "Warning (Cảnh báo)", value: "warning" },
    { label: "Critical (Nghiêm trọng)", value: "critical" },
  ];

  balanceOptions = [
    { label: "All balances (Tất cả số dư)", value: "all" },
    { label: "Receivable only (Chỉ phải thu)", value: "debt" },
    { label: "Payable only (Chỉ phải trả)", value: "credit" },
    { label: "Zero balance (Số dư 0)", value: "zero" },
  ];

  agingOptions = [
    { label: "All aging (Tất cả tuổi nợ)", value: "all" },
    { label: "0-30 days (0-30 ngày)", value: "0-30" },
    { label: "31-60 days (31-60 ngày)", value: "31-60" },
    { label: "61-90 days (61-90 ngày)", value: "61-90" },
    { label: ">90 days (>90 ngày)", value: ">90" },
  ];

  transactionTypeOptions = [
    { label: "Increase receivable (Tăng phải thu)", value: "debt" },
    { label: "Increase payable (Tăng phải trả)", value: "credit" },
  ];

  transactionLedgerTypeOptions = [
    { label: "All types (Tất cả loại)", value: "all" },
    { label: "Receivable (Phải thu)", value: "debt" },
    { label: "Payable (Phải trả)", value: "credit" },
  ];

  transactionPageSizeOptions = [
    { label: "10 / page", value: 10 },
    { label: "20 / page", value: 20 },
    { label: "50 / page", value: 50 },
    { label: "100 / page", value: 100 },
  ];

  constructor(private customerManagementService: CustomerManagementService) {}

  ngOnInit(): void {
    this.loadCustomerOptions();
    this.loadOverview();
    this.loadDebtList();
    this.loadTransactions();
  }

  loadCustomerOptions(): void {
    this.customerManagementService
      .getCustomers({
        search: "",
        status: "all",
        riskLevel: "all",
        page: 1,
        pageSize: 100,
        sortBy: "name",
        sortDirection: "asc",
      })
      .subscribe((response) => {
        this.customerOptions = response.items || [];
        this.refreshCustomerDropdownOptions();
      });
  }

  loadOverview(): void {
    this.overviewLoading = true;
    this.customerManagementService.getDebtOverview(this.query.status, this.query.riskLevel).subscribe({
      next: (response) => {
        this.overview = response;
      },
      complete: () => {
        this.overviewLoading = false;
      },
    });
  }

  loadDebtList(): void {
    this.loading = true;

    this.customerManagementService.getDebtList(this.query).subscribe({
      next: (response) => {
        this.debtItems = response.items || [];
        this.pager.totalItems = response.totalItems || 0;
        this.pager.totalPages = response.totalPages || 0;
        this.loadTransactionCountsForDebtItems(this.debtItems);
      },
      error: () => {
        this.debtItems = [];
        this.transactionCountByCustomerId = {};
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.query.page = 1;
    this.loadOverview();
    this.loadDebtList();
  }

  clearFilters(): void {
    this.query.search = "";
    this.query.status = "all";
    this.query.riskLevel = "all";
    this.query.balanceType = "all";
    this.query.agingBucket = "all";
    this.query.page = 1;
    this.query.sortBy = "netBalance";
    this.query.sortDirection = "desc";
    this.loadOverview();
    this.loadDebtList();
  }

  loadTransactions(): void {
    this.transactionLoading = true;
    const query: DebtTransactionQueryParams = {
      ...this.transactionQuery,
      customerId: this.normalizeCustomerId(this.transactionQuery.customerId),
    };

    this.customerManagementService.getDebtTransactions(query).subscribe({
      next: (response) => {
        this.transactions = response.items || [];
        this.transactionPager.totalItems = response.totalItems || 0;
        this.transactionPager.totalPages = response.totalPages || 0;
      },
      error: () => {
        this.transactions = [];
        this.transactionPager.totalItems = 0;
        this.transactionPager.totalPages = 0;
      },
      complete: () => {
        this.transactionLoading = false;
      },
    });
  }

  openTransactionEditor(item?: DebtItem | DebtTransactionItem): void {
    this.activeTab = "transactions";
    this.editingTransactionId = null;

    const existingTransaction = this.isDebtTransactionItem(item) ? item : null;
    if (existingTransaction) {
      this.editingTransactionId = existingTransaction.id;
      this.transactionForm = {
        customerId: this.normalizeCustomerId(existingTransaction.customerId),
        transactionType: existingTransaction.transactionType,
        amount: Number(existingTransaction.amount || 0),
        transactionAt: this.parseDateValue(existingTransaction.transactionAt) || this.getCurrentDateTime(),
        note: existingTransaction.note || "",
      };
      this.showTransactionEditor = true;
      return;
    }

    this.transactionForm = {
      customerId: this.normalizeCustomerId(item?.id) || this.normalizeCustomerId(this.transactionForm.customerId) || "",
      transactionType: "debt",
      amount: 0,
      transactionAt: this.getCurrentDateTime(),
      note: "",
    };
    this.showTransactionEditor = true;
  }

  cancelTransactionEditor(): void {
    this.showTransactionEditor = false;
    this.savingTransaction = false;
    this.editingTransactionId = null;
  }

  saveTransaction(): void {
    const customerId = this.normalizeCustomerId(this.transactionForm.customerId);
    if (!customerId || this.transactionForm.amount <= 0) {
      return;
    }

    const basePayload = {
      transactionType: this.transactionForm.transactionType,
      amount: Number(this.transactionForm.amount),
      transactionAt: this.toApiDateTime(this.transactionForm.transactionAt),
      note: this.transactionForm.note?.trim(),
    };

    const payload: CreateDebtTransactionPayload = {
      customerId,
      ...basePayload,
    };

    this.savingTransaction = true;
    const request$ = this.editingTransactionId
      ? this.customerManagementService.updateDebtTransaction(this.editingTransactionId, basePayload as UpdateDebtTransactionPayload)
      : this.customerManagementService.addDebtTransaction(payload);

    request$.subscribe({
      next: () => {
        this.cancelTransactionEditor();
        this.loadOverview();
        this.loadDebtList();
        this.transactionQuery.page = 1;
        this.loadTransactions();
      },
      error: () => {
        this.savingTransaction = false;
      },
      complete: () => {
        this.savingTransaction = false;
      },
    });
  }

  openTransactionAuditLogs(tx: DebtTransactionItem): void {
    const transactionId = this.normalizeTransactionId(tx?.id);
    this.selectedTransaction = tx;
    this.showTransactionAuditDialog = true;
    this.transactionAuditLoading = false;
    this.transactionAuditErrorMessage = "";
    this.transactionAuditLogs = [];

    if (!transactionId) {
      this.transactionAuditErrorMessage = "Transaction ID is missing, cannot load audit logs. / Thiếu ID giao dịch nên không thể tải lịch sử thay đổi.";
      return;
    }

    this.transactionAuditLoading = true;
    this.customerManagementService.getDebtTransactionAuditLogs(transactionId, 1, 100).subscribe({
      next: (response) => {
        this.transactionAuditLogs = response.items || [];
      },
      error: () => {
        this.transactionAuditLogs = [];
        this.transactionAuditErrorMessage = "Failed to load transaction audit logs. / Không tải được lịch sử giao dịch.";
      },
      complete: () => {
        this.transactionAuditLoading = false;
      },
    });
  }

  closeTransactionAuditLogs(): void {
    this.showTransactionAuditDialog = false;
    this.transactionAuditLoading = false;
    this.transactionAuditErrorMessage = "";
    this.selectedTransaction = null;
    this.transactionAuditLogs = [];
  }

  openExcelView(item: DebtItem): void {
    const customerId = this.normalizeCustomerId(item?.id);
    this.selectedExcelDebtItem = item;
    this.showExcelDialog = true;
    this.excelLoading = false;
    this.excelErrorMessage = "";
    this.excelTransactions = [];

    if (!customerId) {
      this.excelErrorMessage = "Customer ID is missing, cannot load Excel data. / Thiếu ID khách hàng nên không thể tải dữ liệu Excel.";
      return;
    }

    const query: DebtTransactionQueryParams = {
      search: "",
      customerId,
      transactionType: "all",
      page: 1,
      pageSize: 500,
      sortBy: "transactionAt",
      sortDirection: "asc",
    };

    this.excelLoading = true;
    this.customerManagementService.getDebtTransactions(query).subscribe({
      next: (response) => {
        this.excelTransactions = response.items || [];
        this.transactionCountByCustomerId[customerId] = response.totalItems || this.excelTransactions.length;
      },
      error: () => {
        this.excelTransactions = [];
        this.excelErrorMessage = "Failed to load transaction data. / Không tải được dữ liệu giao dịch.";
      },
      complete: () => {
        this.excelLoading = false;
      },
    });
  }

  openCustomerTransactions(item: DebtItem): void {
    const customerId = this.normalizeCustomerId(item?.id);
    if (!customerId) {
      return;
    }

    this.activeTab = "transactions";
    this.transactionQuery.customerId = customerId;
    this.transactionQuery.search = "";
    this.transactionQuery.transactionType = "all";
    this.transactionQuery.page = 1;
    this.transactionQuery.sortBy = "transactionAt";
    this.transactionQuery.sortDirection = "desc";
    this.loadTransactions();
  }

  closeExcelView(): void {
    this.showExcelDialog = false;
    this.excelLoading = false;
    this.excelErrorMessage = "";
    this.selectedExcelDebtItem = null;
    this.excelTransactions = [];
  }

  exportCustomerExcelFromOverview(item: DebtItem): void {
    const customerId = this.normalizeCustomerId(item?.id);
    if (!customerId) {
      return;
    }

    this.downloadCustomerExcel(customerId, item.code || "khach-hang");
  }

  getCustomerTransactionCount(item: DebtItem): string {
    const customerId = this.normalizeCustomerId(item?.id);
    if (!customerId) {
      return "-";
    }

    if (Object.prototype.hasOwnProperty.call(this.transactionCountByCustomerId, customerId)) {
      return String(this.transactionCountByCustomerId[customerId]);
    }

    return "...";
  }

  getExcelDebitAmount(tx: DebtTransactionItem): number {
    return tx.transactionType === "debt" ? Number(tx.amount || 0) : 0;
  }

  getExcelCreditAmount(tx: DebtTransactionItem): number {
    return tx.transactionType === "credit" ? Number(tx.amount || 0) : 0;
  }

  getExcelTotalDebit(): number {
    return this.excelTransactions.reduce((sum, tx) => sum + this.getExcelDebitAmount(tx), 0);
  }

  getExcelTotalCredit(): number {
    return this.excelTransactions.reduce((sum, tx) => sum + this.getExcelCreditAmount(tx), 0);
  }

  getExcelPeriodRange(): string {
    return this.getPeriodRangeText(this.excelTransactions);
  }

  getExcelLedgerTitle(): string {
    return this.getExcelAccountCode() === "131"
      ? "SỔ CHI TIẾT CÔNG NỢ PHẢI THU"
      : "SỔ CHI TIẾT CÔNG NỢ PHẢI TRẢ";
  }

  getExcelAccountCode(): string {
    const selectedId = this.normalizeCustomerId(this.selectedExcelDebtItem?.id);
    const matchedCustomer = this.customerOptions.find((customer) => this.getCustomerOptionId(customer) === selectedId);
    const rawCategory = (matchedCustomer?.category || "").trim();

    if (rawCategory.includes("131")) {
      return "131";
    }

    if (rawCategory.includes("331")) {
      return "331";
    }

    return this.getExcelTotalDebit() >= this.getExcelTotalCredit() ? "131" : "331";
  }

  getExcelPreviewRows(): Array<{
    voucher: string;
    date: string;
    description: string;
    account: string;
    debit: number | null;
    credit: number | null;
    note: string;
    isPlaceholder: boolean;
  }> {
    const rows = this.excelTransactions.map((tx, index) => ({
      voucher: String(index),
      date: this.formatSheetEntryDate(tx.transactionAt),
      description: tx.note || (tx.transactionType === "credit"
        ? (this.getExcelAccountCode() === "131" ? "THU TIEN CONG NO" : "THANH TOAN CONG NO")
        : (this.getExcelAccountCode() === "131" ? "PHAT SINH CONG NO PHAI THU" : "PHAT SINH CONG NO PHAI TRA")),
      account: this.getExcelAccountCode(),
      debit: this.getExcelDebitAmount(tx) || null,
      credit: this.getExcelCreditAmount(tx) || null,
      note: tx.note || "",
      isPlaceholder: false,
    }));

    const minimumRows = 8;
    const fillers = Array.from({ length: Math.max(0, minimumRows - rows.length) }, () => ({
      voucher: "",
      date: "",
      description: "",
      account: "",
      debit: null,
      credit: null,
      note: "",
      isPlaceholder: true,
    }));

    return [...rows, ...fillers];
  }

  getExcelClosingDebit(): number {
    const balance = this.getExcelTotalDebit() - this.getExcelTotalCredit();
    return balance > 0 ? balance : 0;
  }

  getExcelClosingCredit(): number {
    const balance = this.getExcelTotalDebit() - this.getExcelTotalCredit();
    return balance < 0 ? Math.abs(balance) : 0;
  }

  getExcelSignatureDate(): string {
    const now = new Date();
    return `HCM, Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  }

  formatSheetAmount(value: number | null): string {
    if (value === null || value === undefined || value === 0) {
      return "";
    }

    return this.formatCurrency(value);
  }

  formatSheetEntryDate(value?: string): string {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return `${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
  }

  formatSheetDate(value?: string): string {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const day = date.toLocaleDateString("en-GB", { day: "2-digit" });
    const month = date.toLocaleDateString("en-GB", { month: "2-digit" });
    const year = date.toLocaleDateString("en-GB", { year: "numeric" });
    return `${day}/${month}/${year}`;
  }

  exportSelectedExcelCustomer(): void {
    if (!this.selectedExcelDebtItem) {
      return;
    }

    const customerId = this.normalizeCustomerId(this.selectedExcelDebtItem.id);
    if (!customerId) {
      return;
    }

    this.downloadCustomerExcel(customerId, this.selectedExcelDebtItem.code || "khach-hang");
  }

  getTransactionTypeLabel(value: string): string {
    return value === "credit" ? "Payable / Phải trả" : "Receivable / Phải thu";
  }

  setActiveTab(tab: "overview" | "transactions"): void {
    this.activeTab = tab;
  }

  applyTransactionFilters(): void {
    this.transactionQuery.page = 1;
    this.loadTransactions();
  }

  clearTransactionFilters(): void {
    this.transactionQuery.search = "";
    this.transactionQuery.customerId = "";
    this.transactionQuery.transactionType = "all";
    this.transactionQuery.page = 1;
    this.transactionQuery.pageSize = 10;
    this.transactionQuery.sortBy = "transactionAt";
    this.transactionQuery.sortDirection = "desc";
    this.loadTransactions();
  }

  changeTransactionPage(page: number): void {
    if (page < 1 || page > this.transactionPager.totalPages || page === this.transactionQuery.page) {
      return;
    }

    this.transactionQuery.page = page;
    this.loadTransactions();
  }

  onTransactionPageSizeChange(): void {
    this.transactionQuery.page = 1;
    this.loadTransactions();
  }

  sortTransactionsBy(field: string): void {
    if (this.transactionQuery.sortBy === field) {
      this.transactionQuery.sortDirection = this.transactionQuery.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.transactionQuery.sortBy = field;
      this.transactionQuery.sortDirection = "desc";
    }

    this.loadTransactions();
  }

  getTransactionSortIcon(field: string): string {
    if (this.transactionQuery.sortBy !== field) {
      return "-";
    }

    return this.transactionQuery.sortDirection === "asc" ? "↑" : "↓";
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pager.totalPages || page === this.query.page) {
      return;
    }

    this.query.page = page;
    this.loadDebtList();
  }

  sortBy(field: string): void {
    if (this.query.sortBy === field) {
      this.query.sortDirection = this.query.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.query.sortBy = field;
      this.query.sortDirection = "asc";
    }

    this.loadDebtList();
  }

  getSortIcon(field: string): string {
    if (this.query.sortBy !== field) {
      return "-";
    }

    return this.query.sortDirection === "asc" ? "↑" : "↓";
  }

  formatCurrency(value: number): string {
    return (value || 0).toLocaleString("vi-VN");
  }

  formatDate(value?: string): string {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    const day = date.toLocaleDateString("en-GB", { day: "2-digit" });
    const month = date.toLocaleDateString("en-GB", { month: "short" });
    const year = date.toLocaleDateString("en-GB", { year: "numeric" });
    return `${day} ${month}, ${year}`;
  }

  formatTransactionAuditAction(action?: string): string {
    const map: Record<string, string> = {
      "transaction-create": "Create (Tạo mới)",
      "transaction-update": "Update (Cập nhật)",
      transaction: "System Update (Cập nhật hệ thống)",
    };

    if (!action) {
      return "-";
    }

    return map[action] || action;
  }

  formatTransactionAuditField(field?: string): string {
    if (!field) {
      return "-";
    }

    const match = field.match(/^debtTransaction\.[^.]+\.(.+)$/i);
    const key = match ? match[1] : field;

    const map: Record<string, string> = {
      transactionType: "Transaction Type (Loại giao dịch)",
      amount: "Amount (Số tiền)",
      transactionAt: "Transaction Date (Ngày giao dịch)",
      note: "Note (Ghi chú)",
    };

    return map[key] || field;
  }

  formatTransactionAuditValue(value?: string): string {
    if (value === undefined || value === null || value === "") {
      return "(empty) / (trống)";
    }

    const parsed = this.parseDateValue(value);
    if (parsed) {
      return this.formatDate(parsed.toISOString());
    }

    return value;
  }

  getBalanceClass(value: number): string {
    if (value > 0) {
      return "is-receivable";
    }

    if (value < 0) {
      return "is-payable";
    }

    return "is-zero";
  }

  private getCurrentDateTime(): Date {
    return new Date();
  }

  private parseDateValue(value?: unknown): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  private toApiDateTime(value: unknown): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    const date = new Date(String(value ?? ""));
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    return date.toISOString();
  }

  getCustomerOptionId(customer: CustomerAccount): string {
    return this.normalizeCustomerId(customer?._id) || this.normalizeCustomerId(customer?.Id) || this.normalizeCustomerId(customer?.id) || "";
  }

  private normalizeTransactionId(value?: unknown): string {
    const normalized = String(value ?? "").trim();
    if (!normalized || normalized === "undefined" || normalized === "null") {
      return "";
    }

    return normalized;
  }

  private isDebtTransactionItem(item?: DebtItem | DebtTransactionItem): item is DebtTransactionItem {
    if (!item) {
      return false;
    }

    const source = item as unknown as Record<string, unknown>;
    return typeof source.transactionType === "string" && typeof source.transactionAt === "string";
  }

  private refreshCustomerDropdownOptions(): void {
    const options = this.customerOptions
      .map((customer) => ({
        text: `${customer.code} - ${customer.name}`,
        value: this.getCustomerOptionId(customer),
      }))
      .filter((option) => Boolean(option.value));

    this.transactionCustomerOptions = [{ text: "All customers (Tất cả khách hàng)", value: "" }, ...options];
    this.transactionFormCustomerOptions = [...options];
  }

  private loadTransactionCountsForDebtItems(items: DebtItem[]): void {
    this.transactionCountByCustomerId = {};

    for (const item of items) {
      const customerId = this.normalizeCustomerId(item?.id);
      if (!customerId) {
        continue;
      }

      const query: DebtTransactionQueryParams = {
        search: "",
        customerId,
        transactionType: "all",
        page: 1,
        pageSize: 1,
        sortBy: "transactionAt",
        sortDirection: "desc",
      };

      this.customerManagementService.getDebtTransactions(query).subscribe({
        next: (response) => {
          this.transactionCountByCustomerId[customerId] = response.totalItems || 0;
        },
        error: () => {
          this.transactionCountByCustomerId[customerId] = 0;
        },
      });
    }
  }

  private getPeriodRangeText(transactions: DebtTransactionItem[]): string {
    if (transactions.length === 0) {
      return "Từ ngày --/--/---- đến --/--/----";
    }

    const dates = transactions
      .map((x) => new Date(x.transactionAt))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      return "Từ ngày --/--/---- đến --/--/----";
    }

    const from = this.formatSheetDate(dates[0].toISOString());
    const to = this.formatSheetDate(dates[dates.length - 1].toISOString());
    return `Từ ngày ${from} đến ${to}`;
  }

  private downloadCustomerExcel(customerId: string, fallbackCode: string): void {
    this.customerManagementService.exportDebtCustomerExcel(customerId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          return;
        }

        const fileName = this.extractFileName(response.headers.get("content-disposition"))
          || `so-chi-tiet-cong-no-${fallbackCode}.xlsx`;
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  private extractFileName(contentDisposition: string | null): string {
    if (!contentDisposition) {
      return "";
    }

    const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
      return decodeURIComponent(utfMatch[1]);
    }

    const asciiMatch = contentDisposition.match(/filename="?([^\";]+)"?/i);
    return asciiMatch?.[1] || "";
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
    if (!normalized || normalized === "undefined" || normalized === "null") {
      return "";
    }

    return normalized;
  }

}
