import { Component, OnInit } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { AppFactory } from 'app/shared/lib/common.service';

@Component({  standalone: false,
  selector: 'app-tariff-users',
  templateUrl: './tariff-users.component.html',
  styleUrls: ['./tariff-users.component.css']
})
export class TariffUsersComponent implements OnInit {
  public filterSettings: any = {
    caseSensitive: false,
    operator: 'contains'
  };
  titelPage: any = 'SYSTEM USERS';
  user: any;
  // -----------------------------------------------------
  constructor(
    private _userService: UserService,
    public afac: AppFactory,
  ) {
    this.afac.setTitle(this.titelPage);
  }
  ngOnInit() {
    this._userService.user$.subscribe(async (user: any) => {
      if (user && user?._id) {
        this.user = user
      }
    });
  }
}
