export interface DebtItem {
  id: string;
  code: string;
  name: string;
  phone?: string;
  status: string;
  riskLevel: string;
  debtAmount: number;
  creditAmount: number;
  netBalance: number;
  agingDays: number;
  agingBucket: string;
  lastTransactionAt?: string;
  updatedAt?: string;
}
