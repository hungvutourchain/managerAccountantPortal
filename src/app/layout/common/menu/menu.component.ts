import { Component, ViewEncapsulation, OnDestroy, inject } from '@angular/core';
import { fuseAnimations } from '@fuse/animations/public-api';
import { menuSetting, menuUsers } from 'app/globals';
import { UserService } from 'app/core/user/user.service';
import { environment as env } from 'environments/environment';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// import { FeatureFlagManagerService } from 'app/layout/common/feature-flag-manager.service';
import { MatDialog } from '@angular/material/dialog';
import { FormSubmitDialogComponent } from './form-submit-dialog/form-submit-dialog.component';
@Component({
  standalone: false,
  selector: 'menu-layout',
  templateUrl: './menu.component.html', 
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
  exportAs: 'fuseMenu',
  animations: fuseAnimations,
})
export class MenuComponent implements OnDestroy {
  // private _featureFlagService = inject(FeatureFlagManagerService);
  public listMenu: any = [];
  public menuUsers: any = [];
  public feature: any = {};
  public menuSearch: string = '';
  public groupedMenu: any[] = [];
  public filteredGroupedMenu: any[] = [];
  public openSettingDialog: boolean = false;
  dateTimeFormat = env.dateTimeFormat;
  user: any;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private _userService: UserService,
    private dialog: MatDialog
  ) {
    this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: any) => {
      if (user) {
        // this.loadFeatureFlags()
        this.user = user;
        let tempMenuSetting = orderBy(menuSetting, 'name', 'asc');
        this.menuUsers = orderBy(menuUsers, 'name', 'asc');

        this.listMenu = tempMenuSetting;
        this.groupedMenu = this.listMenu;
        this.filteredGroupedMenu = [...this.groupedMenu];
      }
    });
  }

  onMenuSearch(val: string): void {
    this.menuSearch = val;
    if (!val.trim()) {
      this.filteredGroupedMenu = [...this.groupedMenu];
      return;
    }
    const kw = val.toLowerCase();
    this.filteredGroupedMenu = this.groupedMenu
      .map(g => ({ ...g, items: g.items.filter((x: any) => x.name.toLowerCase().includes(kw)) }))
      .filter(g => g.items.length > 0);
  }
  // loadFeatureFlags() {
  //   // Subscribe to feature flag changes
  //   this._featureFlagService.featureFlags$.pipe(takeUntil(this._unsubscribeAll)).subscribe(async (flags: any) => {
  //     this.feature = flags;
  //   });
  // }

  openFormSubmitDialog(): void {
    const dialogRef = this.dialog.open(FormSubmitDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'form-submit-dialog-panel',
      autoFocus: false,
      disableClose: false,
      data: {
        // Pass any initial data if needed
        user: this.user
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        console.log('Form submission result:', result.data);
        // Handle successful form submission
      } else {
        console.log('Dialog closed without submission');
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(true);
    this._unsubscribeAll.complete();
  }
}
