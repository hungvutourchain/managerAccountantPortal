import { Component } from "@angular/core";

@Component({
  standalone: false,
  selector: "app-main-page-panel-manager",
  templateUrl: "./main-page-panel-manager.component.html",
  styleUrls: ["./main-page-panel-manager.component.scss"],
})
export class MainPagePanelManagerComponent {
  pages = [
    {
      key: "dashboard",
      title: "Dashboard",
      status: "Dang hoat dong",
      owner: "Admin",
    },
    {
      key: "panel-manager",
      title: "Panel Manager",
      status: "Dang hoat dong",
      owner: "Admin",
    },
  ];
}
