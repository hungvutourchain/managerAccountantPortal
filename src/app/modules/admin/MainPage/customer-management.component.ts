import { Component, OnInit } from "@angular/core";
import {
  CustomerAccount,
  CustomerListResponse,
  CustomerSummaryResponse,
} from "./models/customer-management";
import {
  DebtTransactionItem,
  DebtTransactionQueryParams,
} from "./models/debt-management";
import { CustomerManagementService } from "./customer-management.service";
import { TransactionManagementService } from "./transaction-management.service";

type AccountTypeConfigItem = {
  id: string;
  accountType: string;
  accountName?: string;
  accountNameLocal?: string;
  updatedAt?: string;
};

@Component({
  standalone: false,
  selector: "app-customer-management",
  templateUrl: "./customer-management.component.html",
  styleUrls: ["./customer-management.component.scss"],
})
export class CustomerManagementComponent implements OnInit {
  readonly optionFields = { text: "label", value: "value" };
  accountTypeOptions: Array<{
    value: string;
    label: string;
    accountType?: string;
    accountName?: string;
    accountNameLocal?: string;
  }> = [];
  showAccountTypeConfigDialog = false;
  accountTypeConfigLoading = false;
  accountTypeConfigSaving = false;
  accountTypeConfigs: AccountTypeConfigItem[] = [];
  accountTypeConfigForm: {
    id?: string;
    accountType: string;
    accountName: string;
    accountNameLocal: string;
  } = {
      id: undefined,
      accountType: "",
      accountName: "",
      accountNameLocal: "",
    };
  accountTypeConfigQuery = {
    search: "",
    page: 1,
    pageSize: 10,
  };
  accountTypeConfigPager = {
    totalItems: 0,
    totalPages: 0,
  };

  loading = false;
  saving = false;
  showEditor = false;
  showAuditDialog = false;
  showExcelDialog = false;
  auditLoading = false;
  excelLoading = false;
  auditErrorMessage = "";
  excelErrorMessage = "";
  editingId: string | null = null;
  selectedAuditCustomer: CustomerAccount | null = null;
  selectedExcelCustomer: CustomerAccount | null = null;
  excelTransactions: DebtTransactionItem[] = [];
  auditLogs: Array<{
    id: string;
    action: string;
    field: string;
    oldValue?: string;
    newValue?: string;
    changedAt: string;
    changedBy?: string;
    note?: string;
  }> = [];

  formModel: CustomerAccount = this.createEmptyCustomer();

  summary: CustomerSummaryResponse = {
    totalCustomers: 0,
    activeCustomers: 0,
    warningCustomers: 0,
    blockedCustomers: 0,
    totalDebt: 0,
    totalCredit: 0,
  };

  customers: CustomerAccount[] = [];

  query = {
    search: "",
    status: "all",
    riskLevel: "all",
    page: 1,
    pageSize: 10,
    sortBy: "updatedAt",
    sortDirection: "desc" as "asc" | "desc",
  };

  pager = {
    totalItems: 0,
    totalPages: 0,
  };

  statusOptions = [
    { label: "All statuses (Tất cả trạng thái)", value: "all" },
    { label: "Active (Đang hoạt động)", value: "active" },
    { label: "Blocked (Tạm khóa)", value: "blocked" },
  ];

  editorStatusOptions = [
    { label: "Active (Đang hoạt động)", value: "active" },
    { label: "Blocked (Tạm khóa)", value: "blocked" },
  ];

  riskOptions = [
    { label: "All risk levels (Tất cả rủi ro)", value: "all" },
    { label: "Normal (Bình thường)", value: "normal" },
    { label: "Warning (Cảnh báo)", value: "warning" },
    { label: "Critical (Nghiêm trọng)", value: "critical" },
  ];

  editorRiskOptions = [
    { label: "Normal (Bình thường)", value: "normal" },
    { label: "Warning (Cảnh báo)", value: "warning" },
    { label: "Critical (Nghiêm trọng)", value: "critical" },
  ];

  constructor(
    private customerService: CustomerManagementService,
    private transactionManagementService: TransactionManagementService,
  ) {}

  ngOnInit(): void {
    this.loadAccountTypeOptions();
    this.loadSummary();
    this.loadCustomers();
  }

  loadAccountTypeOptions(): void {
    this.customerService.getAccountTypes("", true, 500).subscribe({
      next: (items) => {
        this.accountTypeOptions = Array.isArray(items) && items.length > 0
          ? items.map((item) => ({
            ...item,
            label: this.buildAccountTypeBilingualLabel(item),
          }))
          : [];
      },
      error: () => {
        this.accountTypeOptions = [];
      },
    });
  }

  openAccountTypeConfigManager(): void {
    this.showAccountTypeConfigDialog = true;
    this.resetAccountTypeConfigForm();
    this.accountTypeConfigQuery.page = 1;
    this.loadAccountTypeConfigs();
  }

  closeAccountTypeConfigManager(): void {
    this.showAccountTypeConfigDialog = false;
    this.accountTypeConfigLoading = false;
    this.accountTypeConfigSaving = false;
    this.accountTypeConfigs = [];
    this.accountTypeConfigQuery.search = "";
    this.accountTypeConfigQuery.page = 1;
    this.accountTypeConfigPager.totalItems = 0;
    this.accountTypeConfigPager.totalPages = 0;
    this.resetAccountTypeConfigForm();
  }

  loadAccountTypeConfigs(): void {
    this.accountTypeConfigLoading = true;
    this.customerService.getAccountTypeConfigs(
      this.accountTypeConfigQuery.search,
      this.accountTypeConfigQuery.page,
      this.accountTypeConfigQuery.pageSize,
    ).subscribe({
      next: (response) => {
        this.accountTypeConfigs = response?.items || [];
        this.accountTypeConfigPager.totalItems = response?.totalItems || 0;
        this.accountTypeConfigPager.totalPages = response?.totalPages || 0;
      },
      error: () => {
        this.accountTypeConfigs = [];
        this.accountTypeConfigPager.totalItems = 0;
        this.accountTypeConfigPager.totalPages = 0;
      },
      complete: () => {
        this.accountTypeConfigLoading = false;
      },
    });
  }

  applyAccountTypeConfigFilters(): void {
    this.accountTypeConfigQuery.page = 1;
    this.loadAccountTypeConfigs();
  }

  clearAccountTypeConfigFilters(): void {
    this.accountTypeConfigQuery.search = "";
    this.accountTypeConfigQuery.page = 1;
    this.loadAccountTypeConfigs();
  }

  changeAccountTypeConfigPage(page: number): void {
    if (page < 1 || page > this.accountTypeConfigPager.totalPages || page === this.accountTypeConfigQuery.page) {
      return;
    }

    this.accountTypeConfigQuery.page = page;
    this.loadAccountTypeConfigs();
  }

  startCreateAccountTypeConfig(): void {
    this.resetAccountTypeConfigForm();
  }

  startEditAccountTypeConfig(item: AccountTypeConfigItem): void {
    this.accountTypeConfigForm = {
      id: item.id,
      accountType: item.accountType || "",
      accountName: item.accountName || "",
      accountNameLocal: item.accountNameLocal || "",
    };
  }

  saveAccountTypeConfig(): void {
    const accountType = (this.accountTypeConfigForm.accountType || "").trim();
    if (!accountType) {
      return;
    }

    this.accountTypeConfigSaving = true;
    this.customerService.upsertAccountTypeConfig({
      id: this.accountTypeConfigForm.id,
      accountType,
      accountName: (this.accountTypeConfigForm.accountName || "").trim(),
      accountNameLocal: (this.accountTypeConfigForm.accountNameLocal || "").trim(),
    }).subscribe({
      next: () => {
        this.resetAccountTypeConfigForm();
        this.loadAccountTypeConfigs();
        this.loadAccountTypeOptions();
      },
      error: () => {
        window.alert("Save failed, please check duplicate account type. / Lưu thất bại, vui lòng kiểm tra trùng loại tài khoản.");
      },
      complete: () => {
        this.accountTypeConfigSaving = false;
      },
    });
  }

  deleteAccountTypeConfig(item: AccountTypeConfigItem): void {
    if (!item?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete account type ${item.accountType}? / Xóa loại tài khoản ${item.accountType}?`,
    );
    if (!confirmed) {
      return;
    }

    this.customerService.deleteAccountTypeConfig(item.id).subscribe({
      next: () => {
        this.loadAccountTypeConfigs();
        this.loadAccountTypeOptions();
      },
    });
  }

  loadSummary(): void {
    this.customerService.getSummary().subscribe((response) => {
      this.summary = response;
    });
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomers(this.query).subscribe({
      next: (response: CustomerListResponse) => {
        this.customers = response.items || [];
        this.pager.totalItems = response.totalItems || 0;
        this.pager.totalPages = response.totalPages || 0;
      },
      error: () => {
        this.customers = [];
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.query.page = 1;
    this.loadCustomers();
  }

  clearFilters(): void {
    this.query.search = "";
    this.query.status = "all";
    this.query.riskLevel = "all";
    this.query.page = 1;
    this.query.sortBy = "updatedAt";
    this.query.sortDirection = "desc";
    this.loadCustomers();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pager.totalPages || page === this.query.page) {
      return;
    }
    this.query.page = page;
    this.loadCustomers();
  }

  sortBy(field: string): void {
    if (this.query.sortBy === field) {
      this.query.sortDirection = this.query.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.query.sortBy = field;
      this.query.sortDirection = "asc";
    }
    this.loadCustomers();
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

  getNetBalance(item: CustomerAccount): number {
    return (item.debtAmount || 0) - (item.creditAmount || 0);
  }

  openCreateForm(): void {
    this.editingId = null;
    this.formModel = this.createEmptyCustomer();
    this.showEditor = true;
  }

  openEditForm(item: CustomerAccount): void {
    const itemId = this.getItemId(item);
    this.editingId = itemId;
    this.formModel = {
      ...item,
      id: itemId || undefined,
      Id: itemId || undefined,
    };
    this.ensureAccountTypeOption(this.formModel.category);
    this.showEditor = true;
  }

  cancelEdit(): void {
    this.showEditor = false;
    this.editingId = null;
    this.formModel = this.createEmptyCustomer();
  }

  saveCustomer(): void {
    if (!this.formModel.name?.trim() || !this.formModel.code?.trim()) {
      return;
    }

    this.saving = true;
    const payload: CustomerAccount = {
      ...this.formModel,
      Id: this.editingId || undefined,
      id: this.editingId || undefined,
    };

    this.customerService.upsertCustomer(payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadSummary();
        this.loadCustomers();
      },
      complete: () => {
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  deleteCustomer(item: CustomerAccount): void {
    const id = this.getItemId(item);
    if (!id) {
      window.alert("Customer ID is missing, cannot delete this record. / Thiếu ID khách hàng nên không thể xóa bản ghi này.");
      return;
    }

    const confirmed = window.confirm(`Delete customer ${item.name}? / Xóa khách hàng ${item.name}?`);
    if (!confirmed) {
      return;
    }

    this.customerService.deleteCustomer(id).subscribe(() => {
      this.loadSummary();
      this.loadCustomers();
    });
  }

  openAuditLogs(item: CustomerAccount): void {
    this.selectedAuditCustomer = item;
    this.showAuditDialog = true;
    this.auditLoading = false;
    this.auditLogs = [];
    this.auditErrorMessage = "";

    const id = this.getItemId(item);
    if (!id) {
      this.auditErrorMessage = "Customer ID is missing, cannot load audit logs. / Thiếu ID khách hàng nên không thể tải lịch sử thay đổi.";
      return;
    }

    this.auditLoading = true;

    this.customerService.getCustomerAuditLogs(id, 1, 100).subscribe({
      next: (response) => {
        this.auditLogs = response.items || [];
      },
      error: () => {
        this.auditLogs = [];
        this.auditErrorMessage = "Failed to load audit logs. / Không tải được lịch sử thay đổi.";
      },
      complete: () => {
        this.auditLoading = false;
      },
    });
  }

  closeAuditLogs(): void {
    this.showAuditDialog = false;
    this.auditLoading = false;
    this.auditErrorMessage = "";
    this.selectedAuditCustomer = null;
    this.auditLogs = [];
  }

  openExcelView(item: CustomerAccount): void {
    const customerId = this.getItemId(item);
    this.selectedExcelCustomer = item;
    this.showExcelDialog = true;
    this.excelLoading = false;
    this.excelErrorMessage = "";
    this.excelTransactions = [];

    if (!customerId) {
      this.excelErrorMessage = "Customer ID is missing, cannot load Excel view. / Thiếu ID khách hàng nên không thể tải dữ liệu Excel.";
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
    this.transactionManagementService.getDebtTransactions(query).subscribe({
      next: (response) => {
        this.excelTransactions = response.items || [];
      },
      error: () => {
        this.excelTransactions = [];
        this.excelErrorMessage = "Failed to load transaction data for Excel view. / Không tải được dữ liệu giao dịch để xem Excel.";
      },
      complete: () => {
        this.excelLoading = false;
      },
    });
  }

  closeExcelView(): void {
    this.showExcelDialog = false;
    this.excelLoading = false;
    this.excelErrorMessage = "";
    this.selectedExcelCustomer = null;
    this.excelTransactions = [];
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
    if (this.excelTransactions.length === 0) {
      return "Từ ngày --/--/---- đến --/--/----";
    }

    const dates = this.excelTransactions
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

  getExcelLedgerTitle(): string {
    return this.getExcelAccountCode() === "131"
      ? "SỔ CHI TIẾT CÔNG NỢ PHẢI THU"
      : "SỔ CHI TIẾT CÔNG NỢ PHẢI TRẢ";
  }

  getExcelAccountCode(): string {
    const rawCategory = (this.selectedExcelCustomer?.category || "").trim();
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

  exportCustomerExcel(): void {
    if (!this.selectedExcelCustomer) {
      return;
    }

    const customerId = this.getItemId(this.selectedExcelCustomer);
    if (!customerId) {
      return;
    }

    this.customerService.exportDebtCustomerExcel(customerId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          return;
        }

        const fallbackCode = this.selectedExcelCustomer?.code || "khach-hang";
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

  formatDateTime(value?: string): string {
    if (!value) {
      return "N/A";
    }

    const parsedDate = this.parseAuditDate(value);
    if (!parsedDate) {
      return "N/A";
    }

    return this.formatToDdMmmYyyy(parsedDate, true);
  }

  formatAuditValue(value?: string): string {
    if (value === undefined || value === null || value === "") {
      return "(empty) / (trống)";
    }

    const parsedDate = this.parseAuditDate(value);
    if (parsedDate) {
      return this.formatToDdMmmYyyy(parsedDate);
    }

    return value;
  }

  formatAuditDate(value?: string): string {
    if (!value) {
      return "N/A";
    }

    const parsedDate = this.parseAuditDate(value);
    if (!parsedDate) {
      return value;
    }

    return this.formatToDdMmmYyyy(parsedDate, true);
  }

  getAuditFieldLabel(field?: string): string {
    if (!field) {
      return "-";
    }

    const staticMap: Record<string, string> = {
      record: "Record (Bản ghi)",
      code: "Customer Code (Mã khách hàng)",
      name: "Customer Name (Tên khách hàng)",
      category: "Category (Nhóm)",
      taxCode: "Tax Code (MST)",
      bankAccount: "Bank Account (Số tài khoản)",
      bankName: "Bank Name (Ngân hàng)",
      phone: "Phone (Số điện thoại)",
      email: "Email",
      address: "Address (Địa chỉ)",
      status: "Status (Trạng thái)",
      riskLevel: "Risk Level (Mức rủi ro)",
      owner: "Owner (Người phụ trách)",
      debtAmount: "Debt Amount (Dư nợ phải thu)",
      creditAmount: "Credit Amount (Dư có phải trả)",
      lastTransactionAt: "Last Transaction Date (Ngày giao dịch gần nhất)",
      "debtTransactions.count": "Transaction Count (Số lượng giao dịch)",
      tags: "Tags (Nhãn)",
    };

    if (staticMap[field]) {
      return staticMap[field];
    }

    const transactionField = field.match(/^debtTransaction\.[^.]+\.(.+)$/i);
    if (transactionField) {
      const detailMap: Record<string, string> = {
        transactionType: "Transaction Type (Loại giao dịch)",
        amount: "Amount (Số tiền)",
        transactionAt: "Transaction Date (Ngày giao dịch)",
        note: "Note (Ghi chú)",
      };

      const detailKey = transactionField[1];
      if (detailMap[detailKey]) {
        return detailMap[detailKey];
      }
    }

    return field;
  }

  private parseAuditDate(value: string): Date | null {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const looksLikeDate = /(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})|(\d{1,2}-\d{1,2}-\d{2,4})|(T\d{2}:\d{2})/.test(normalized);
    if (!looksLikeDate) {
      return null;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private formatToDdMmmYyyy(date: Date, includeTime = false): string {
    const day = date.toLocaleDateString("en-GB", { day: "2-digit" });
    const month = date.toLocaleDateString("en-GB", { month: "short" });
    const year = date.toLocaleDateString("en-GB", { year: "numeric" });

    if (!includeTime) {
      return `${day} ${month}, ${year}`;
    }

    const time = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${day} ${month}, ${year} ${time}`;
  }

  private getItemId(item: CustomerAccount): string | null {
    const source = item as unknown as Record<string, unknown>;
    const candidates: unknown[] = [
      item?._id,
      source?._id,
      source?.["_id"],
      item?.Id,
      item?.id,
      source?.["Id"],
      source?.["id"],
    ];

    for (const candidate of candidates) {
      const resolved = this.resolveIdValue(candidate);
      if (resolved) {
        return resolved;
      }
    }

    return null;
  }

  private resolveIdValue(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized ? normalized : null;
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
        if (typeof nested === "string" && nested.trim()) {
          return nested.trim();
        }
      }
    }

    return null;
  }

  private createEmptyCustomer(): CustomerAccount {
    return {
      code: "",
      name: "",
      category: "",
      taxCode: "",
      bankAccount: "",
      bankName: "",
      phone: "",
      email: "",
      address: "",
      debtAmount: 0,
      creditAmount: 0,
      status: "active",
      riskLevel: "normal",
      owner: "",
      tags: [],
    };
  }

  private resetAccountTypeConfigForm(): void {
    this.accountTypeConfigForm = {
      id: undefined,
      accountType: "",
      accountName: "",
      accountNameLocal: "",
    };
  }

  private ensureAccountTypeOption(accountType?: string): void {
    const normalized = (accountType || "").trim();
    if (!normalized) {
      return;
    }

    const exists = this.accountTypeOptions.some((x) => (x.value || "").trim() === normalized);
    if (exists) {
      return;
    }

    this.accountTypeOptions = [
      ...this.accountTypeOptions,
      {
        value: normalized,
        label: this.buildAccountTypeBilingualLabel({
          value: normalized,
          accountType: normalized,
        }),
        accountType: normalized,
      },
    ];
  }

  private buildAccountTypeBilingualLabel(item: {
    value?: string;
    accountType?: string;
    accountName?: string;
    accountNameLocal?: string;
    label?: string;
  }): string {
    const type = (item.accountType || item.value || "").trim();
    const englishRaw = (item.accountName || "").trim();
    const vietnameseRaw = (item.accountNameLocal || "").trim();

    const english = englishRaw;
    const vietnamese = vietnameseRaw || this.extractVietnameseFromLabel(item.label || "");

    if (english && vietnamese) {
      return `${type} - ${english} (${vietnamese})`;
    }

    if (english) {
      return type ? `${type} - ${english}` : english;
    }

    if (vietnamese) {
      return type ? `${type} - ${vietnamese}` : vietnamese;
    }

    return type || (item.label || "");
  }

  private extractVietnameseFromLabel(label: string): string {
    const normalized = String(label || "").trim();
    if (!normalized) {
      return "";
    }

    const removedPrefix = normalized.replace(/^\d+\s*-\s*/, "").trim();
    const viInParens = removedPrefix.match(/\(([^)]+)\)\s*$/);
    if (viInParens?.[1]) {
      return viInParens[1].trim();
    }

    return removedPrefix;
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
}
