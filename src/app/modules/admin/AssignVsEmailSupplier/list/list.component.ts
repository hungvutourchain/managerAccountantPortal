import { Component, OnInit, Input, Output, ViewEncapsulation, EventEmitter } from "@angular/core";
import * as _ from "lodash";
import { AppFactory } from "app/shared/lib/common.service";
import { DbService } from "app/shared/connectData/db.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UserService } from 'app/core/user/user.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LocalStorageService } from 'angular-web-storage';
import { ActivatedRoute, Params, Router } from "@angular/router";
@Component({  standalone: false,
  selector: "app-assign-vs-email-supplier-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AssignVsEmailSupplierListComponent implements OnInit {
  public filterSettings: any = {
    caseSensitive: false,
    operator: "contains",
  };
  notifi(type, mes, miliseconds = 4000): void {
    this._snackBar.open(mes, type, {
      duration: miliseconds,
      panelClass: [type === 'error' ? 'red-snackbar' : 'blue-snackbar'],
      verticalPosition: 'top', horizontalPosition: 'center'
    })
  }
  Math = Math;
  lsSupplier: any = []
  seviceTypes: any = []
  _firstloading: boolean = true
  user: any = ''
  idAssignVsEmails: any = ''
  isNewAssignVsEmails: any = ''
  showEditAssignVsEmails: boolean = false
  loading: boolean = true
  filter: any = {
    search: ""
  }
  LsDetail: any = []
  pageSizeOptions: number[] = [50, 100, 200, 500];
  totalitems: any = 0
  pageEvent: any = { previousPageIndex: 0, pageIndex: 0, pageSize: 50, length: 0 }
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  constructor(
    public afac: AppFactory,
    private local: LocalStorageService,
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _userService: UserService,
    private dbService: DbService,
  ) { }
  async ngOnInit() {
    let showEditAssignVsEmails = this.local.get('showEditAssignVsEmails');
    if (showEditAssignVsEmails) this.showEditAssignVsEmails = true;
    this._firstloading = true;
    this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe(async (user: any) => {
      if (user && user?._id) {
        this.user = user
        try {
          let [lsSupplier, seviceTypes] = await Promise.all([
            this.dbService.getSupplier(this.user.nation).toPromise(),
            this.dbService.getServiceTypes(this.user.nation).toPromise(),
          ])
          this.lsSupplier = lsSupplier
          this.seviceTypes = seviceTypes
          this._firstloading = false
          let isNew: any = this.afac._getUrlParameter("newcompose")
          if (isNew === 'true') {
            this._activatedRoute.queryParams.subscribe(async (params: Params) => {
              this._router.navigate([], { queryParams: { ...params, tab: 4, newcompose: false } });
            });
            this.AssignVsEmails('new', null, true)
            this.loading = false
            this.loadData()
          } else this.loadData()
        }
        catch (err) {
          this.notifi("error", "Load data fail !", 7000)
          console.log("Load data fail!", err)
        }
      }
    })
  }
  Change_page(event) {
    this.pageEvent = event;
    this.loadData();
  }
  clearFilter() {
    this.filter = {
      search: '',
      supplierId: '',
    }
    this.loadData();
  }
  async loadData() {
    this.loading = true;
    this.filter.nation = this.user.nation
    this.filter._pageNumber = this.pageEvent.pageIndex + 1
    this.filter._pageSize = this.pageEvent.pageSize
    let rs = await this.dbService.GetAssignVsEmails(this.filter).toPromise()
    this.totalitems = rs.total ?? 0
    this.LsDetail = rs.items ?? []
    if (this.LsDetail.length > 0) {
      this.LsDetail.forEach(item => {
        let object = this.lsSupplier.find(x => x._idService == item._idService)
        if (object) item.supplier = `${object.name || ''} | ${object.serviceName || ''}`
      })
    }
    this.loading = false;
  }

  AssignVsEmails(action: any, vl: any, isNew: boolean = false) {
    switch (action) {
      case "new":
        this.local.set('showEditAssignVsEmails', true);
        this.idAssignVsEmails = null
        this.isNewAssignVsEmails = isNew
        this.showEditAssignVsEmails = true
        break;
      case "view":
        this.idAssignVsEmails = vl._id
        this.showEditAssignVsEmails = true
        break;
    }
  }
  outAction(ev: any) {
    this.showEditAssignVsEmails = false
    this.local.set('showEditAssignVsEmails', false);
    this.loadData();
  }
  CloseAssignVsEmails() {
    this.showEditAssignVsEmails = false
    this.local.set('showEditAssignVsEmails', false);
  }
}
