export interface DebtAgingBucket {
  bucket: string;
  amount: number;
  customers: number;
}

export interface DebtTopDebtor {
  id: string;
  code: string;
  name: string;
  status: string;
  riskLevel: string;
  agingDays: number;
  lastTransactionAt?: string;
  netBalance: number;
}

export interface DebtOverviewResponse {
  totalReceivable: number;
  totalPayable: number;
  netExposure: number;
  highRiskExposure: number;
  customerCount: number;
  debtorCount: number;
  creditorCount: number;
  agingBuckets: DebtAgingBucket[];
  topDebtors: DebtTopDebtor[];
}
