import { CustomerAccount } from "./customer-account.model";

export interface CustomerListResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: CustomerAccount[];
}
