import { Component } from "@angular/core";

@Component({
  standalone: false,
  selector: "app-main-page",
  templateUrl: "./main-page.component.html",
  styleUrls: ["./main-page.component.scss"],
})
export class MainPageComponent {
  menuItems = [
    {
      enLabel: "Customer Management",
      viLabel: "Quản lý khách hàng",
      route: "customer-management",
      enDescription: "List, debt tracking, risk alerts",
      viDescription: "Danh sách, công nợ, cảnh báo rủi ro",
    },
    {
      enLabel: "Debt Management",
      viLabel: "Quản lý công nợ",
      route: "debt-management",
      enDescription: "Aging analysis, receivable/payable, debt concentration",
      viDescription: "Phân tích tuổi nợ, phải thu/phải trả, tập trung công nợ",
    },
    {
      enLabel: "Report Center",
      viLabel: "Trung tâm báo cáo",
      route: "report-center",
      enDescription: "Run customer and debt reports in one place",
      viDescription: "Chạy báo cáo khách hàng và công nợ trong một nơi",
    },
  ];
}
