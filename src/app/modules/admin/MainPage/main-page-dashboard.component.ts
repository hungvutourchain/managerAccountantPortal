import { Component } from "@angular/core";

@Component({
  standalone: false,
  selector: "app-main-page-dashboard",
  templateUrl: "./main-page-dashboard.component.html",
  styleUrls: ["./main-page-dashboard.component.scss"],
})
export class MainPageDashboardComponent {
  cards = [
    {
      title: "Tong so page con",
      value: "2",
      note: "Dang duoc quan ly trong panel ben phai",
    },
    {
      title: "Trang thai",
      value: "San sang",
      note: "Co the bo sung them route moi bat cu luc nao",
    },
    {
      title: "Muc tieu",
      value: "Trung tam dieu huong",
      note: "Day la trang chu de quan ly he thong nho",
    },
  ];
}
