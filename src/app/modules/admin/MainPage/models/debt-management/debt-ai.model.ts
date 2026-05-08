export interface DebtAiQueryRequest {
  prompt: string;
  context: DebtAiContext;
  history?: DebtAiHistoryMessage[];
}

export interface DebtAiHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DebtAiContext {
  activeTab: string;
  overview: DebtAiOverview;
  filters: DebtAiFilterSummary;
  debtItems: DebtAiDebtItem[];
  transactions: DebtAiTransactionItem[];
  selectedTransactions: DebtAiTransactionItem[];
}

export interface DebtAiOverview {
  totalReceivable: number;
  totalPayable: number;
  netExposure: number;
  highRiskExposure: number;
  customerCount: number;
}

export interface DebtAiFilterSummary {
  overviewSearch: string;
  overviewStatus: string;
  overviewRiskLevel: string;
  overviewBalanceType: string;
  transactionSearch: string;
  transactionCustomerId: string;
  transactionType: string;
  cartLockedCustomerId: string | null;
}

export interface DebtAiDebtItem {
  id: string;
  code: string;
  name: string;
  status: string;
  riskLevel: string;
  debtAmount: number;
  creditAmount: number;
  netBalance: number;
  agingDays: number;
  agingBucket: string;
  lastTransactionAt?: string;
}

export interface DebtAiTransactionItem {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  transactionType: "debt" | "credit";
  amount: number;
  transactionAt: string;
  note?: string;
  createdBy?: string;
}

export interface DebtAiQueryResponse {
  provider: string;
  model: string;
  summary: string;
  findings: string[];
  recommendations: string[];
  relatedCustomers: string[];
  scopeNotes: string[];
  suggestedQuestions: string[];
  answer: string;
  rawText?: string;
  generatedAt: string;
}