import { DebtItem } from "./debt-item.model";

export interface DebtListResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: DebtItem[];
}
