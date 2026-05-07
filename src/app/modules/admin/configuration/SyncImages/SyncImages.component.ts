import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { environment as env } from 'environments/environment';
import { AppFactory } from 'app/shared/lib/common.service';
import * as _ from 'lodash';
@Component({  standalone: false,
  selector: 'app-sync-images',
  templateUrl: './SyncImages.component.html',
  styleUrls: ['./SyncImages.component.css']
})
export class ImagesComponent implements OnInit {
  public ajaxSettings: object
  public view: string
  titelPage: any = 'File Manager'
  public hostUrl: string = env.imageDomain
  user: any
  str: any = ''
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
    })
  }
}
