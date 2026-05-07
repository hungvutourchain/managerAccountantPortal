export interface CustomerAccount {
  _id?: string | { $oid?: string; oid?: string; id?: string; Id?: string };
  id?: string;
  Id?: string;
  code: string;
  name: string;
  category: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  phone?: string;
  email?: string;
  address?: string;
  debtAmount: number;
  creditAmount: number;
  status: string;
  riskLevel: string;
  owner?: string;
  tags?: string[];
  lastTransactionAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  auditLogs?: Array<{
    id: string;
    action: string;
    field: string;
    oldValue?: string;
    newValue?: string;
    changedAt: string;
    changedBy?: string;
    note?: string;
  }>;
}
