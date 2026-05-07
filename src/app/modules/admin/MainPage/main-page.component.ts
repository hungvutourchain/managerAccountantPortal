import { Component } from "@angular/core";

@Component({
  selector: "app-main-page",
  templateUrl: "./main-page.component.html",
  styleUrls: ["./main-page.component.scss"],
})
export class MainPageComponent {
  menuItems = [
    {
      label: "Tong quan",
      route: "dashboard",
      description: "Trang dieu khien chinh",
    },
    {
      label: "Quan ly panel",
      route: "panel-manager",
      description: "Quan ly cac page con ben phai",
    },
  ];
}
