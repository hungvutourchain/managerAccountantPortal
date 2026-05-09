import { Component, OnInit } from "@angular/core";
import { FilteringEventArgs } from "@syncfusion/ej2-angular-dropdowns";
import { DialogUtility } from "@syncfusion/ej2-popups";
import { Observable } from "rxjs";
import { CustomerManagementService } from "./customer-management.service";
import { TransactionManagementService } from "./transaction-management.service";
import {
  CreateDebtTransactionPayload,
  DebtAiContext,
  DebtAiDebtItem,
  DebtAiHistoryMessage,
  DebtAiQueryRequest,
  DebtAiQueryResponse,
  DebtAiTransactionItem,
  DebtCustomerExcelExportHistoryItem,
  DebtCustomerExcelExportHistoryQuery,
  DebtTransactionAttachmentItem,
  DebtTransactionAuditLogItem,
  DebtTransactionMutationResponse,
  DebtItem,
  DebtOverviewResponse,
  DebtTransactionItem,
  DebtTransactionQueryParams,
  UpdateDebtTransactionPayload,
} from "./models/debt-management";
import { CustomerAccount } from "./models/customer-management";

interface DebtAiConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  loading?: boolean;
  error?: boolean;
  provider?: string;
  model?: string;
  summary?: string;
  findings?: string[];
  recommendations?: string[];
  relatedCustomers?: string[];
  scopeNotes?: string[];
  suggestedQuestions?: string[];
  rawText?: string;
}

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
  showExcelHistoryDialog = false;
  showDebtAiDialog = false;
  transactionAuditLoading = false;
  excelLoading = false;
  excelHistoryLoading = false;
  aiLoading = false;
  transactionAuditErrorMessage = "";
  excelErrorMessage = "";
  excelHistoryErrorMessage = "";
  transactionEditorErrorMessage = "";
  editingTransactionId: string | null = null;
  selectedTransaction: DebtTransactionItem | null = null;
  selectedExcelDebtItem: DebtItem | null = null;
  aiPrompt = "";
  aiCopiedMessageId: string | null = null;
  aiMessages: DebtAiConversationMessage[] = [];
  transactionPendingFiles: File[] = [];
  transactionFileDragActive = false;
  transactionDownloadingAttachmentIds: string[] = [];
  transactionDeletingAttachmentIds: string[] = [];

  // Cart – selected transactions for Excel view/export
  cartItems: DebtTransactionItem[] = [];
  cartLockedCustomerId: string | null = null;
  cartExpanded = false;

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
  excelExportHistoryItems: DebtCustomerExcelExportHistoryItem[] = [];
  transactionCountByCustomerId: Record<string, number> = {};
  excelHistoryDownloadingIds: string[] = [];
  excelHistoryCustomerId = "";
  excelHistoryFromDate: Date | null = null;
  excelHistoryToDate: Date | null = null;

  excelHistoryPager = {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  };

  excelHistoryQuery: DebtCustomerExcelExportHistoryQuery = {
    search: "",
    exportedBy: "",
    fromDate: "",
    toDate: "",
    page: 1,
    pageSize: 10,
    sortBy: "exportedAt",
    sortDirection: "desc",
  };

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
    accountType: "",
    transactionType: "debt" as "debt" | "credit",
    amount: 0,
    transactionAt: this.getCurrentDateTime(),
    contractCode: "",
    note: "",
    attachments: [] as DebtTransactionAttachmentItem[],
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

  transactionAccountTypeOptions: Array<{
    value: string;
    label: string;
    accountType?: string;
    accountName?: string;
    accountNameLocal?: string;
    balanceSide?: string;
  }> = [];

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

  aiPromptSuggestions = [
    "Tóm tắt nhanh tình hình công nợ hiện tại và nêu khách hàng rủi ro nhất.",
    "Tìm các giao dịch bất thường hoặc có giá trị lớn trong danh sách hiện tại.",
    "Phân tích các giao dịch tôi đã chọn trong cart và nêu điểm cần kiểm tra.",
  ];

  constructor(
    private customerManagementService: CustomerManagementService,
    private transactionManagementService: TransactionManagementService,
  ) {}

  ngOnInit(): void {
    this.loadTransactionAccountTypeOptions();
    this.loadCustomerOptions();
    this.loadOverview();
    this.loadDebtList();
    this.loadTransactions();
  }

  loadTransactionAccountTypeOptions(): void {
    this.customerManagementService.getAccountTypes("", true, 500).subscribe({
      next: (items) => {
        this.transactionAccountTypeOptions = Array.isArray(items) && items.length > 0
          ? items.map((item) => ({
            ...item,
            label: this.buildTransactionAccountTypeLabel(item),
          }))
          : [];
      },
      error: () => {
        this.transactionAccountTypeOptions = [];
      },
    });
  }

  onTransactionAccountTypeFiltering(args: FilteringEventArgs): void {
    const keyword = this.normalizeDropdownSearchText(args.text || "");

    if (!keyword) {
      args.updateData(this.transactionAccountTypeOptions);
      return;
    }

    const filteredOptions = this.transactionAccountTypeOptions.filter((item) => {
      const accountType = this.normalizeDropdownSearchText(item.accountType || item.value || "");
      const english = this.normalizeDropdownSearchText(item.accountName || "");
      const vietnamese = this.normalizeDropdownSearchText(item.accountNameLocal || "");
      const label = this.normalizeDropdownSearchText(item.label || "");

      return accountType.includes(keyword)
        || english.includes(keyword)
        || vietnamese.includes(keyword)
        || label.includes(keyword);
    });

    args.updateData(filteredOptions);
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

    this.transactionManagementService.getDebtTransactions(query).subscribe({
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
    this.transactionEditorErrorMessage = "";
    this.transactionPendingFiles = [];

    const existingTransaction = this.isDebtTransactionItem(item) ? item : null;
    if (existingTransaction) {
      const customerId = this.normalizeCustomerId(existingTransaction.customerId);
      const accountTypeByCustomer = this.getAccountTypeByCustomerId(customerId);
      const accountType = (existingTransaction.accountType || accountTypeByCustomer || this.getAccountTypeByTransactionType(existingTransaction.transactionType)).trim();
      this.editingTransactionId = existingTransaction.id;
      this.transactionForm = {
        customerId,
        accountType,
        transactionType: existingTransaction.transactionType,
        amount: Number(existingTransaction.amount || 0),
        transactionAt: this.parseDateValue(existingTransaction.transactionAt) || this.getCurrentDateTime(),
        contractCode: existingTransaction.contractCode || "",
        note: existingTransaction.note || "",
        attachments: [...(existingTransaction.attachments || [])],
      };

      this.ensureTransactionAccountTypeOption(accountType);
      this.showTransactionEditor = true;
      return;
    }

    const customerId = this.normalizeCustomerId(item?.id) || this.normalizeCustomerId(this.transactionForm.customerId) || "";
    const accountType = this.getAccountTypeByCustomerId(customerId) || "";

    this.transactionForm = {
      customerId,
      accountType,
      transactionType: this.getTransactionTypeByAccountType(accountType, "debt"),
      amount: 0,
      transactionAt: this.getCurrentDateTime(),
      contractCode: "",
      note: "",
      attachments: [],
    };

    this.ensureTransactionAccountTypeOption(accountType);
    this.onTransactionCustomerChanged();
    this.showTransactionEditor = true;
  }

  cancelTransactionEditor(): void {
    this.showTransactionEditor = false;
    this.savingTransaction = false;
    this.editingTransactionId = null;
    this.transactionEditorErrorMessage = "";
    this.transactionPendingFiles = [];
    this.transactionDownloadingAttachmentIds = [];
    this.transactionDeletingAttachmentIds = [];
  }

  saveTransaction(): void {
    if (!this.canSubmitTransactionForm()) {
      this.transactionEditorErrorMessage = "Please fill all required fields (Customer, Amount, Contract Code). / Vui lòng nhập đủ trường bắt buộc (Khách hàng, Số tiền, Mã hợp đồng).";
      return;
    }

    const customerId = this.normalizeCustomerId(this.transactionForm.customerId);
    const contractCode = this.transactionForm.contractCode?.trim();
    if (!contractCode) {
      this.transactionEditorErrorMessage = "Contract code is required. / Mã hợp đồng là bắt buộc.";
      return;
    }

    const transactionType = this.getTransactionTypeByAccountType(this.transactionForm.accountType, this.transactionForm.transactionType);
    this.transactionForm.transactionType = transactionType;
    const accountType = (this.transactionForm.accountType || "").trim() || this.getAccountTypeByTransactionType(transactionType);

    const basePayload = {
      customerId,
      accountType,
      transactionType,
      amount: Number(this.transactionForm.amount),
      transactionAt: this.toApiDateTime(this.transactionForm.transactionAt),
      contractCode,
      note: this.transactionForm.note?.trim(),
    };

    const payload: CreateDebtTransactionPayload = {
      customerId,
      accountType,
      transactionType: basePayload.transactionType,
      amount: basePayload.amount,
      transactionAt: basePayload.transactionAt,
      contractCode: basePayload.contractCode,
      note: basePayload.note,
    };

    this.transactionEditorErrorMessage = "";
    this.savingTransaction = true;
    const request$ = this.editingTransactionId
      ? this.transactionManagementService.updateDebtTransaction(this.editingTransactionId, basePayload as UpdateDebtTransactionPayload)
      : this.transactionManagementService.addDebtTransaction(payload);

    request$.subscribe({
      next: (response: DebtTransactionMutationResponse) => {
        const transactionId = this.normalizeTransactionId(response?.transaction?.id);
        this.transactionForm.attachments = [...(response?.transaction?.attachments || [])];
        this.refreshAfterTransactionMutation();

        if (!transactionId || this.transactionPendingFiles.length === 0) {
          this.savingTransaction = false;
          this.cancelTransactionEditor();
          return;
        }

        const pendingFiles = [...this.transactionPendingFiles];
        this.transactionManagementService.uploadDebtTransactionAttachments(transactionId, pendingFiles).subscribe({
          next: (uploadResponse) => {
            this.transactionForm.attachments = [...(uploadResponse.attachments || [])];
            this.transactionPendingFiles = [];
            this.savingTransaction = false;
            this.cancelTransactionEditor();
            this.loadTransactions();
          },
          error: () => {
            this.savingTransaction = false;
            this.editingTransactionId = transactionId;
            this.transactionEditorErrorMessage = "Transaction was saved, but file upload failed. / Giao dịch đã lưu nhưng tải file lên thất bại.";
          },
        });
      },
      error: () => {
        this.savingTransaction = false;
        this.transactionEditorErrorMessage = "Failed to save transaction. / Lưu giao dịch thất bại.";
      },
    });
  }

  onTransactionFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const selectedFiles = Array.from(input?.files || []);
    this.appendPendingTransactionFiles(selectedFiles);

    if (input) {
      input.value = "";
    }
  }

  onTransactionFileDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.transactionFileDragActive = true;
  }

  onTransactionFileDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.transactionFileDragActive = true;
  }

  onTransactionFileDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.transactionFileDragActive = false;
  }

  onTransactionFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.transactionFileDragActive = false;

    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    this.appendPendingTransactionFiles(droppedFiles);
  }

  removePendingTransactionFile(index: number): void {
    this.transactionPendingFiles.splice(index, 1);
  }

  downloadTransactionAttachment(attachment: DebtTransactionAttachmentItem): void {
    const transactionId = this.normalizeTransactionId(this.editingTransactionId);
    const attachmentId = this.normalizeTransactionId(attachment?.id);
    if (!transactionId || !attachmentId || this.transactionDownloadingAttachmentIds.includes(attachmentId)) {
      return;
    }

    this.transactionDownloadingAttachmentIds = [...this.transactionDownloadingAttachmentIds, attachmentId];
    this.transactionManagementService.downloadDebtTransactionAttachment(transactionId, attachmentId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          return;
        }

        const fileName = this.extractFileName(response.headers.get("content-disposition"))
          || attachment.fileName
          || "download.bin";
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.transactionEditorErrorMessage = "Failed to download file. / Tải file thất bại.";
      },
      complete: () => {
        this.transactionDownloadingAttachmentIds = this.transactionDownloadingAttachmentIds
          .filter((id) => id !== attachmentId);
      },
    });
  }

  async deleteTransactionAttachment(attachment: DebtTransactionAttachmentItem): Promise<void> {
    const transactionId = this.normalizeTransactionId(this.editingTransactionId);
    const attachmentId = this.normalizeTransactionId(attachment?.id);
    if (!transactionId || !attachmentId || this.transactionDeletingAttachmentIds.includes(attachmentId)) {
      return;
    }

    const confirmed = await this.showConfirmDialog(
      `Delete file ${attachment.fileName}? / Xóa file ${attachment.fileName}?`,
      "Confirm delete / Xác nhận xóa",
    );
    if (!confirmed) {
      return;
    }

    this.transactionDeletingAttachmentIds = [...this.transactionDeletingAttachmentIds, attachmentId];
    this.transactionManagementService.deleteDebtTransactionAttachment(transactionId, attachmentId).subscribe({
      next: (response) => {
        this.transactionForm.attachments = [...(response.attachments || [])];
        this.loadTransactions();
      },
      error: () => {
        this.transactionEditorErrorMessage = "Failed to delete file. / Xóa file thất bại.";
      },
      complete: () => {
        this.transactionDeletingAttachmentIds = this.transactionDeletingAttachmentIds
          .filter((id) => id !== attachmentId);
      },
    });
  }

  getReadableFileSize(size: number): string {
    if (!size || size < 1024) {
      return `${size || 0} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  canSubmitTransactionForm(): boolean {
    const customerId = this.normalizeCustomerId(this.transactionForm.customerId);
    const contractCode = this.transactionForm.contractCode?.trim();
    const amount = Number(this.transactionForm.amount || 0);

    return !!customerId && !!contractCode && amount > 0;
  }

  onTransactionCustomerChanged(): void {
    const accountType = this.getAccountTypeByCustomerId(this.transactionForm.customerId);
    if (!accountType) {
      return;
    }

    this.transactionForm.accountType = accountType;
    this.ensureTransactionAccountTypeOption(accountType);
    this.transactionForm.transactionType = this.getTransactionTypeByAccountType(accountType, this.transactionForm.transactionType);
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
    this.transactionManagementService.getDebtTransactionAuditLogs(transactionId, 1, 100).subscribe({
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
    this.transactionManagementService.getDebtTransactions(query).subscribe({
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

  openCustomerExportHistory(item: DebtItem): void {
    this.selectedExcelDebtItem = item;
    this.openExcelExportHistory();
  }

  openLedgerExportHistory(): void {
    const customerId = this.normalizeCustomerId(this.transactionQuery.customerId);
    if (customerId) {
      const linkedDebtItem = this.debtItems.find((item) => this.normalizeCustomerId(item?.id) === customerId) || null;
      this.selectedExcelDebtItem = linkedDebtItem;
      this.openExcelExportHistory();
      return;
    }

    if (this.cartLockedCustomerId) {
      this.selectedExcelDebtItem = this.debtItems.find(
        (item) => this.normalizeCustomerId(item?.id) === this.normalizeCustomerId(this.cartLockedCustomerId),
      ) || null;
      this.openExcelExportHistory();
      return;
    }

    this.showInfoDialog(
      "Please choose a customer before opening export history. / Vui lòng chọn khách hàng trước khi mở lịch sử xuất.",
      "Export History Notice / Lưu ý lịch sử xuất",
      [
        "Use Customer filter in Transaction Ledger to scope the history. / Dùng bộ lọc Khách hàng trong Transaction Ledger để khoanh phạm vi lịch sử.",
        "Or select transactions from one customer to lock the scope. / Hoặc chọn giao dịch của 1 khách hàng để khóa phạm vi.",
      ],
    );
  }

  closeExcelView(): void {
    this.showExcelDialog = false;
    this.excelLoading = false;
    this.excelErrorMessage = "";
    this.selectedExcelDebtItem = null;
    this.excelTransactions = [];
  }

  openExcelExportHistory(): void {
    const customerId = this.resolveExcelHistoryCustomerId();
    if (!customerId) {
      this.excelErrorMessage = "Cannot determine customer to load export history. / Không xác định được khách hàng để tải lịch sử export.";
      return;
    }

    this.showExcelHistoryDialog = true;
    this.excelHistoryCustomerId = customerId;
    this.excelHistoryQuery.page = 1;
    this.loadExcelExportHistory();
  }

  closeExcelExportHistory(): void {
    this.showExcelHistoryDialog = false;
    this.excelHistoryLoading = false;
    this.excelHistoryErrorMessage = "";
    this.excelExportHistoryItems = [];
    this.excelHistoryDownloadingIds = [];
    this.excelHistoryCustomerId = "";
    this.excelHistoryFromDate = null;
    this.excelHistoryToDate = null;
    this.excelHistoryQuery = {
      search: "",
      exportedBy: "",
      fromDate: "",
      toDate: "",
      page: 1,
      pageSize: 10,
      sortBy: "exportedAt",
      sortDirection: "desc",
    };
    this.excelHistoryPager = {
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    };
  }

  changeExcelHistoryPage(page: number): void {
    if (page < 1 || page > this.excelHistoryPager.totalPages || page === this.excelHistoryPager.page) {
      return;
    }

    this.excelHistoryQuery.page = page;
    this.excelHistoryPager.page = page;
    this.loadExcelExportHistory();
  }

  applyExcelHistoryFilters(): void {
    this.excelHistoryQuery.page = 1;
    this.loadExcelExportHistory();
  }

  clearExcelHistoryFilters(): void {
    this.excelHistoryQuery.search = "";
    this.excelHistoryQuery.exportedBy = "";
    this.excelHistoryQuery.fromDate = "";
    this.excelHistoryQuery.toDate = "";
    this.excelHistoryQuery.sortBy = "exportedAt";
    this.excelHistoryQuery.sortDirection = "desc";
    this.excelHistoryQuery.page = 1;
    this.loadExcelExportHistory();
  }

  onExcelHistoryPageSizeChange(): void {
    this.excelHistoryQuery.page = 1;
    this.loadExcelExportHistory();
  }

  onExcelHistoryFromDateChange(event: { value?: Date | null }): void {
    const value = event?.value instanceof Date ? event.value : null;
    this.excelHistoryFromDate = value;
    this.excelHistoryQuery.fromDate = this.formatDateQuery(value);
  }

  onExcelHistoryToDateChange(event: { value?: Date | null }): void {
    const value = event?.value instanceof Date ? event.value : null;
    this.excelHistoryToDate = value;
    this.excelHistoryQuery.toDate = this.formatDateQuery(value);
  }

  downloadExcelHistoryItem(item: DebtCustomerExcelExportHistoryItem): void {
    const customerId = this.normalizeCustomerId(this.excelHistoryCustomerId);
    const historyId = this.normalizeTransactionId(item?.id);
    if (!customerId || !historyId || this.excelHistoryDownloadingIds.includes(historyId)) {
      return;
    }

    this.excelHistoryDownloadingIds = [...this.excelHistoryDownloadingIds, historyId];
    this.transactionManagementService.downloadDebtCustomerExcelExportHistory(customerId, historyId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          return;
        }

        const fileName = this.extractFileName(response.headers.get("content-disposition"))
          || item.fileName
          || "debt-export.xlsx";
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.excelHistoryErrorMessage = "Failed to download exported file. / Tải file export thất bại.";
      },
      complete: () => {
        this.excelHistoryDownloadingIds = this.excelHistoryDownloadingIds.filter((id) => id !== historyId);
      },
    });
  }

  // ── Cart methods ──────────────────────────────────────────────────────────

  isInCart(tx: DebtTransactionItem): boolean {
    const id = this.normalizeTransactionId(tx?.id);
    return id ? this.cartItems.some((c) => this.normalizeTransactionId(c?.id) === id) : false;
  }

  isCartLocked(tx: DebtTransactionItem): boolean {
    if (!this.cartLockedCustomerId || this.cartItems.length === 0) {
      return false;
    }

    const txCustomerId = this.normalizeCustomerId(tx?.customerId);
    return txCustomerId !== this.cartLockedCustomerId;
  }

  toggleCartItem(tx: DebtTransactionItem): void {
    const id = this.normalizeTransactionId(tx?.id);
    if (!id) {
      return;
    }

    const txCustomerId = this.normalizeCustomerId(tx?.customerId);
    const contractCode = (tx?.contractCode || "").trim();
    const normalizedContractCode = this.normalizeContractCode(contractCode);

    if (this.isInCart(tx)) {
      if (normalizedContractCode) {
        this.cartItems = this.cartItems.filter(
          (c) => this.normalizeContractCode(c?.contractCode) !== normalizedContractCode,
        );
      } else {
        this.cartItems = this.cartItems.filter((c) => this.normalizeTransactionId(c?.id) !== id);
      }

      if (this.cartItems.length === 0) {
        this.cartLockedCustomerId = null;
      } else {
        this.cartLockedCustomerId = this.normalizeCustomerId(this.cartItems[0]?.customerId) || null;
      }

      return;
    }

    if (this.cartLockedCustomerId && txCustomerId !== this.cartLockedCustomerId) {
      return; // silently block – UI disables the checkbox already
    }

    if (!this.cartLockedCustomerId && txCustomerId) {
      this.cartLockedCustomerId = txCustomerId;
    }

    if (normalizedContractCode && txCustomerId) {
      this.addContractTransactionsToCart(tx, txCustomerId, contractCode, normalizedContractCode);
      return;
    }

    this.cartItems = [...this.cartItems, tx];
  }

  private addContractTransactionsToCart(
    seedTransaction: DebtTransactionItem,
    customerId: string,
    contractCode: string,
    normalizedContractCode: string,
  ): void {
    this.loadTransactionsByContractCodePage(customerId, contractCode, normalizedContractCode, 1, []).subscribe({
      next: (matchedTransactions) => {
        const byId = new Map<string, DebtTransactionItem>();

        for (const item of this.cartItems) {
          const existingId = this.normalizeTransactionId(item?.id);
          if (existingId) {
            byId.set(existingId, item);
          }
        }

        const seedId = this.normalizeTransactionId(seedTransaction?.id);
        if (seedId) {
          byId.set(seedId, seedTransaction);
        }

        for (const item of matchedTransactions) {
          const itemId = this.normalizeTransactionId(item?.id);
          if (itemId) {
            byId.set(itemId, item);
          }
        }

        this.cartItems = Array.from(byId.values());
      },
      error: () => {
        const exists = this.cartItems.some(
          (item) => this.normalizeTransactionId(item?.id) === this.normalizeTransactionId(seedTransaction?.id),
        );
        if (!exists) {
          this.cartItems = [...this.cartItems, seedTransaction];
        }
      },
    });
  }

  private loadTransactionsByContractCodePage(
    customerId: string,
    contractCode: string,
    normalizedContractCode: string,
    page: number,
    collected: DebtTransactionItem[],
  ): Observable<DebtTransactionItem[]> {
    const query: DebtTransactionQueryParams = {
      search: contractCode,
      customerId,
      transactionType: "all",
      page,
      pageSize: 200,
      sortBy: "transactionAt",
      sortDirection: "desc",
    };

    return new Observable<DebtTransactionItem[]>((observer) => {
      this.transactionManagementService.getDebtTransactions(query).subscribe({
        next: (response) => {
          const currentPageMatches = (response.items || [])
            .filter((item) => this.normalizeContractCode(item.contractCode) === normalizedContractCode);
          const merged = [...collected, ...currentPageMatches];
          const totalPages = response.totalPages || 0;

          if (page < totalPages) {
            this.loadTransactionsByContractCodePage(customerId, contractCode, normalizedContractCode, page + 1, merged)
              .subscribe({
                next: (items) => observer.next(items),
                error: (error) => observer.error(error),
                complete: () => observer.complete(),
              });
            return;
          }

          observer.next(merged);
          observer.complete();
        },
        error: (error) => observer.error(error),
      });
    });
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartLockedCustomerId = null;
    this.cartExpanded = false;
  }

  toggleCartExpanded(): void {
    this.cartExpanded = !this.cartExpanded;
  }

  openCartExcelView(): void {
    if (this.cartItems.length === 0) {
      return;
    }

    const customer = this.debtItems.find(
      (item) => this.normalizeCustomerId(item?.id) === this.cartLockedCustomerId,
    ) || null;

    this.selectedExcelDebtItem = customer;
    this.excelTransactions = [...this.cartItems].sort(
      (a, b) => new Date(a.transactionAt).getTime() - new Date(b.transactionAt).getTime(),
    );
    this.excelErrorMessage = "";
    this.excelLoading = false;
    this.showExcelDialog = true;
  }

  exportCartExcel(): void {
    if (this.cartItems.length === 0 || !this.cartLockedCustomerId) {
      return;
    }

    const customer = this.debtItems.find(
      (item) => this.normalizeCustomerId(item?.id) === this.cartLockedCustomerId,
    );
    const fallbackCode = customer?.code || "khach-hang";
    const cartIds = this.cartItems
      .map((tx) => this.normalizeTransactionId(tx?.id))
      .filter(Boolean);

    this.downloadCustomerExcel(this.cartLockedCustomerId, fallbackCode, cartIds);
  }

  // ── End cart methods ──────────────────────────────────────────────────────

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
    return this.getEffectiveTransactionType(tx) === "debt" ? Number(tx.amount || 0) : 0;
  }

  getExcelCreditAmount(tx: DebtTransactionItem): number {
    return this.getEffectiveTransactionType(tx) === "credit" ? Number(tx.amount || 0) : 0;
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
    const accountTypeCode = this.getExcelAccountCode();
    if (accountTypeCode === "131") {
      return "SỔ CHI TIẾT CÔNG NỢ PHẢI THU";
    }

    if (accountTypeCode === "331") {
      return "SỔ CHI TIẾT CÔNG NỢ PHẢI TRẢ";
    }

    return accountTypeCode ? `SỔ CHI TIẾT CÔNG NỢ TK ${accountTypeCode}` : "SỔ CHI TIẾT CÔNG NỢ";
  }

  getExcelAccountCode(): string {
    const normalizedTransactionAccountType = this.getExcelPrimaryAccountType();
    if (normalizedTransactionAccountType) {
      return normalizedTransactionAccountType;
    }

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
      description: tx.note || this.getExcelRowDescription(tx),
      account: this.getExcelTransactionAccountCode(tx),
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

  getTransactionAccountTypeLabel(value?: string): string {
    const normalized = (value || "").trim();
    if (!normalized) {
      return "-";
    }

    const matched = this.transactionAccountTypeOptions.find((item) => (item.value || "").trim() === normalized);
    return matched?.label || normalized;
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

  private getExcelPrimaryAccountType(): string {
    const transactionAccountType = this.excelTransactions
      .map((tx) => (tx.accountType || "").trim())
      .find((value) => !!value);

    if (transactionAccountType) {
      return transactionAccountType;
    }

    const selectedItemAccountType = (this.selectedExcelDebtItem as DebtItem & { accountType?: string } | null)?.accountType;
    return (selectedItemAccountType || "").trim();
  }

  private getExcelTransactionAccountCode(tx: DebtTransactionItem): string {
    const transactionAccountType = (tx.accountType || "").trim();
    if (transactionAccountType) {
      return transactionAccountType;
    }

    return this.getExcelAccountCode();
  }

  private getExcelRowDescription(tx: DebtTransactionItem): string {
    const accountCode = this.getExcelTransactionAccountCode(tx);
    if (accountCode && accountCode !== "131" && accountCode !== "331") {
      return `PHAT SINH TK ${accountCode}`;
    }

    return this.getEffectiveTransactionType(tx) === "credit"
      ? (accountCode === "131" ? "THU TIEN CONG NO" : "THANH TOAN CONG NO")
      : (accountCode === "131" ? "PHAT SINH CONG NO PHAI THU" : "PHAT SINH CONG NO PHAI TRA");
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

  applyAiPromptSuggestion(prompt: string): void {
    this.aiPrompt = prompt;
  }

  openDebtAiDialog(): void {
    this.showDebtAiDialog = true;
  }

  closeDebtAiDialog(): void {
    this.showDebtAiDialog = false;
  }

  askDebtAi(promptOverride?: string): void {
    if (this.aiLoading) {
      return;
    }

    const prompt = (promptOverride ?? this.aiPrompt).trim();
    if (!prompt) {
      return;
    }

    const userMessage: DebtAiConversationMessage = {
      id: this.generateAiMessageId(),
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    const pendingMessage: DebtAiConversationMessage = {
      id: this.generateAiMessageId(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      loading: true,
    };

    this.aiMessages = [...this.aiMessages, userMessage, pendingMessage];
    this.aiLoading = true;
    this.aiPrompt = promptOverride ? this.aiPrompt : "";

    this.transactionManagementService.queryDebtAi(this.buildDebtAiRequest(prompt)).subscribe({
      next: (response) => {
        this.replacePendingAiMessage(pendingMessage.id, this.buildAssistantMessage(response));
      },
      error: (error) => {
        this.replacePendingAiMessage(pendingMessage.id, {
          id: pendingMessage.id,
          role: "assistant",
          content: error?.error?.message || "Gemini request failed. / Gọi Gemini thất bại.",
          createdAt: new Date().toISOString(),
          error: true,
        });
      },
      complete: () => {
        this.aiLoading = false;
      },
    });
  }

  clearDebtAi(): void {
    this.aiPrompt = "";
    this.aiCopiedMessageId = null;
    this.aiMessages = [];
  }

  retryDebtAi(prompt: string): void {
    this.askDebtAi(prompt);
  }

  async copyAiMessage(message: DebtAiConversationMessage): Promise<void> {
    const text = this.getAiMessageCopyText(message);
    if (!text) {
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        this.aiCopiedMessageId = message.id;
        setTimeout(() => {
          if (this.aiCopiedMessageId === message.id) {
            this.aiCopiedMessageId = null;
          }
        }, 1800);
      }
    } catch {
    }
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

  private buildDebtAiRequest(prompt: string): DebtAiQueryRequest {
    const context: DebtAiContext = {
      activeTab: this.activeTab,
      overview: {
        totalReceivable: this.overview.totalReceivable,
        totalPayable: this.overview.totalPayable,
        netExposure: this.overview.netExposure,
        highRiskExposure: this.overview.highRiskExposure,
        customerCount: this.overview.customerCount,
      },
      filters: {
        overviewSearch: this.query.search,
        overviewStatus: this.query.status,
        overviewRiskLevel: this.query.riskLevel,
        overviewBalanceType: this.query.balanceType,
        transactionSearch: this.transactionQuery.search,
        transactionCustomerId: this.normalizeCustomerId(this.transactionQuery.customerId),
        transactionType: this.transactionQuery.transactionType,
        cartLockedCustomerId: this.cartLockedCustomerId,
      },
      debtItems: this.debtItems.slice(0, 20).map((item) => this.mapDebtItemToAi(item)),
      transactions: this.transactions.slice(0, 50).map((item) => this.mapTransactionItemToAi(item)),
      selectedTransactions: this.cartItems.slice(0, 50).map((item) => this.mapTransactionItemToAi(item)),
    };

    return {
      prompt,
      context,
      history: this.buildDebtAiHistory(),
    };
  }

  private buildDebtAiHistory(): DebtAiHistoryMessage[] {
    return this.aiMessages
      .filter((message) => !message.loading)
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: this.getAiMessageCopyText(message),
      }));
  }

  private buildAssistantMessage(response: DebtAiQueryResponse): DebtAiConversationMessage {
    return {
      id: this.generateAiMessageId(),
      role: "assistant",
      content: response.answer || response.summary || "",
      createdAt: response.generatedAt || new Date().toISOString(),
      provider: response.provider || "gemini",
      model: response.model || "",
      summary: response.summary || "",
      findings: response.findings || [],
      recommendations: response.recommendations || [],
      relatedCustomers: response.relatedCustomers || [],
      scopeNotes: response.scopeNotes || [],
      suggestedQuestions: response.suggestedQuestions || [],
      rawText: response.rawText || "",
    };
  }

  private replacePendingAiMessage(messageId: string, nextMessage: DebtAiConversationMessage): void {
    this.aiMessages = this.aiMessages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      return {
        ...nextMessage,
        id: messageId,
      };
    });
  }

  private getAiMessageCopyText(message: DebtAiConversationMessage): string {
    if (message.role === "user") {
      return message.content || "";
    }

    const parts = [message.summary, ...(message.findings || []), ...(message.recommendations || []), message.content]
      .filter((item) => typeof item === "string" && item.trim());
    return parts.join("\n");
  }

  private generateAiMessageId(): string {
    return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private mapDebtItemToAi(item: DebtItem): DebtAiDebtItem {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      status: item.status,
      riskLevel: item.riskLevel,
      debtAmount: item.debtAmount,
      creditAmount: item.creditAmount,
      netBalance: item.netBalance,
      agingDays: item.agingDays,
      agingBucket: item.agingBucket,
      lastTransactionAt: item.lastTransactionAt,
    };
  }

  private mapTransactionItemToAi(item: DebtTransactionItem): DebtAiTransactionItem {
    return {
      id: item.id,
      customerId: item.customerId,
      customerCode: item.customerCode,
      customerName: item.customerName,
      transactionType: item.transactionType,
      amount: item.amount,
      transactionAt: item.transactionAt,
      note: item.note,
      createdBy: item.createdBy,
    };
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

  formatAuditDateTime(value?: string): string {
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
    const time = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${day} ${month}, ${year} ${time}`;
  }

  formatExportPeriod(from?: string, to?: string): string {
    const fromText = this.formatSheetDate(from);
    const toText = this.formatSheetDate(to);

    if (!fromText || !toText) {
      return "--/--/---- → --/--/----";
    }

    return `${fromText} → ${toText}`;
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

  private getAccountTypeByTransactionType(transactionType: "debt" | "credit"): string {
    return transactionType === "credit" ? "331" : "131";
  }

  private getTransactionTypeByAccountType(accountType: string, fallback: "debt" | "credit" = "debt"): "debt" | "credit" {
    const normalized = String(accountType || "").trim().toLowerCase();
    if (!normalized) {
      return fallback;
    }

    const matchedConfig = this.transactionAccountTypeOptions.find((item) => String(item.value || "").trim().toLowerCase() === normalized);
    if (matchedConfig?.balanceSide === "debit") {
      return "debt";
    }

    if (matchedConfig?.balanceSide === "credit") {
      return "credit";
    }

    if (normalized.startsWith("1") || normalized.includes("131")) {
      return "debt";
    }

    if (normalized.startsWith("3") || normalized.includes("331")) {
      return "credit";
    }

    return fallback;
  }

  private getEffectiveTransactionType(tx: DebtTransactionItem): "debt" | "credit" {
    return this.getTransactionTypeByAccountType(tx.accountType || "", tx.transactionType === "credit" ? "credit" : "debt");
  }

  private getAccountTypeByCustomerId(customerId: string): string | null {
    const normalizedId = this.normalizeCustomerId(customerId);
    if (!normalizedId) {
      return null;
    }

    const customer = this.customerOptions.find((x) => this.getCustomerOptionId(x) === normalizedId);
    const rawCategory = String(customer?.category || "").trim();
    return rawCategory || null;
  }

  private ensureTransactionAccountTypeOption(accountType?: string): void {
    const normalized = String(accountType || "").trim();
    if (!normalized) {
      return;
    }

    const exists = this.transactionAccountTypeOptions.some((x) => String(x.value || "").trim() === normalized);
    if (exists) {
      return;
    }

    this.transactionAccountTypeOptions = [
      ...this.transactionAccountTypeOptions,
      {
        value: normalized,
        label: this.buildTransactionAccountTypeLabel({
          value: normalized,
          accountType: normalized,
        }),
        accountType: normalized,
      },
    ];
  }

  private buildTransactionAccountTypeLabel(item: {
    value?: string;
    accountType?: string;
    accountName?: string;
    accountNameLocal?: string;
    label?: string;
  }): string {
    const type = (item.accountType || item.value || "").trim();
    const english = (item.accountName || "").trim();
    const vietnamese = (item.accountNameLocal || "").trim();

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

  private normalizeTransactionId(value?: unknown): string {
    const normalized = String(value ?? "").trim();
    if (!normalized || normalized === "undefined" || normalized === "null") {
      return "";
    }

    return normalized;
  }

  private normalizeDropdownSearchText(value?: unknown): string {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
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

      this.transactionManagementService.getDebtTransactions(query).subscribe({
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

  private downloadCustomerExcel(customerId: string, fallbackCode: string, transactionIds?: string[]): void {
    this.transactionManagementService.exportDebtCustomerExcel(customerId, transactionIds).subscribe({
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

  private loadExcelExportHistory(): void {
    const customerId = this.normalizeCustomerId(this.excelHistoryCustomerId);
    if (!customerId) {
      this.excelHistoryErrorMessage = "Customer ID is missing, cannot load export history. / Thiếu ID khách hàng nên không tải được lịch sử export.";
      this.excelExportHistoryItems = [];
      return;
    }

    this.excelHistoryLoading = true;
    this.excelHistoryErrorMessage = "";

    this.transactionManagementService
      .getDebtCustomerExcelExportHistory(customerId, this.excelHistoryQuery)
      .subscribe({
        next: (response) => {
          this.excelExportHistoryItems = response.items || [];
          this.excelHistoryPager.page = response.page || this.excelHistoryQuery.page;
          this.excelHistoryPager.pageSize = response.pageSize || this.excelHistoryQuery.pageSize;
          this.excelHistoryPager.totalItems = response.totalItems || 0;
          this.excelHistoryPager.totalPages = response.totalPages || 0;
        },
        error: () => {
          this.excelExportHistoryItems = [];
          this.excelHistoryPager.totalItems = 0;
          this.excelHistoryPager.totalPages = 0;
          this.excelHistoryErrorMessage = "Failed to load export history. / Không tải được lịch sử export.";
        },
        complete: () => {
          this.excelHistoryLoading = false;
        },
      });
  }

  private refreshAfterTransactionMutation(): void {
    this.loadOverview();
    this.loadDebtList();
    this.transactionQuery.page = 1;
    this.loadTransactions();
  }

  private appendPendingTransactionFiles(files: File[]): void {
    if (!files || files.length === 0) {
      return;
    }

    const existingKeys = new Set(this.transactionPendingFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
    for (const file of files) {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!existingKeys.has(key)) {
        this.transactionPendingFiles.push(file);
        existingKeys.add(key);
      }
    }
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

  private normalizeContractCode(value?: string): string {
    return (value || "").trim().toLowerCase();
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

  private showInfoDialog(content: string, title = "Notification / Thông báo", highlights: string[] = []): void {
    const safeContent = this.escapeHtml(content);
    const highlightItems = highlights
      .map((item) => `<li>${this.escapeHtml(item)}</li>`)
      .join("");
    const formattedContent = `
      <div class="debt-dialog-message debt-dialog-message--info">
        <div class="debt-dialog-message__icon" aria-hidden="true">
          <i class="bi bi-info-circle-fill"></i>
        </div>
        <div class="debt-dialog-message__body">
          <p class="debt-dialog-message__headline">Action needed / Cần thao tác</p>
          <p class="debt-dialog-message__text">${safeContent}</p>
          ${highlightItems ? `<ul class="debt-dialog-message__highlights">${highlightItems}</ul>` : ""}
        </div>
      </div>`;

    DialogUtility.alert({
      title,
      content: formattedContent,
      cssClass: "debt-pro-dialog debt-pro-dialog--info",
      position: { X: "center", Y: "center" },
      okButton: { text: "OK" },
      showCloseIcon: true,
      closeOnEscape: true,
    });
  }

  private showConfirmDialog(content: string, title = "Confirm / Xác nhận"): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finalize = (value: boolean): void => {
        if (settled) {
          return;
        }

        settled = true;
        resolve(value);
      };

      DialogUtility.confirm({
        title,
        content: `<div class="debt-dialog-message debt-dialog-message--confirm"><p class="debt-dialog-message__text">${this.escapeHtml(content)}</p></div>`,
        cssClass: "debt-pro-dialog debt-pro-dialog--confirm",
        position: { X: "center", Y: "center" },
        okButton: {
          text: "Yes / Đồng ý",
          click: () => finalize(true),
        },
        cancelButton: {
          text: "No / Hủy",
          click: () => finalize(false),
        },
        showCloseIcon: true,
        closeOnEscape: true,
        close: () => finalize(false),
      });
    });
  }

  private escapeHtml(value: string): string {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private resolveExcelHistoryCustomerId(): string {
    const selectedId = this.normalizeCustomerId(this.selectedExcelDebtItem?.id);
    if (selectedId) {
      return selectedId;
    }

    const filteredCustomerId = this.normalizeCustomerId(this.transactionQuery.customerId);
    if (filteredCustomerId) {
      return filteredCustomerId;
    }

    return this.normalizeCustomerId(this.cartLockedCustomerId);
  }

}
