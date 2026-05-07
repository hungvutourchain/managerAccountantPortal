import { Component, ViewEncapsulation, OnDestroy, inject } from '@angular/core';
import { fuseAnimations } from '@fuse/animations/public-api';
import { menuSetting, menuUsers } from 'app/globals';
import { UserService } from 'app/core/user/user.service';
import { environment as env } from 'environments/environment';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FeatureFlagManagerService } from 'app/layout/common/feature-flag-manager.service';
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
  private _featureFlagService = inject(FeatureFlagManagerService);
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

  private readonly GROUP_MAP: { [key: string]: string } = {
    // Email & Communication
    'Email Dictionary': 'Email', 'Email Templates': 'Email', 'Attached Files': 'Email',
    'Email History Management': 'Email', 'Default Email SendToOPE': 'Email',
    'Email Logs': 'Email', 'Outgoing Mailbox': 'Email',
    'Cut-off Mail Services Remind': 'Email', 'UnAssigned Services Remind': 'Email',
    // Tariff & Pricing
    'Period List': 'Tariff', 'Tour Duration': 'Tariff', 'Exchange Rate': 'Tariff',
    'Markup scheme': 'Tariff', 'Pax scheme': 'Tariff', 'Period Configure': 'Tariff', 'Banks': 'Tariff',
    // Tours & Services
    'Tour Category': 'Tours', 'Tour style': 'Tours', 'Service Type': 'Tours',
    'Supplier': 'Tours', 'Vehicle Type': 'Tours', 'Tipping Services': 'Tours',
    'Default Policy Settings': 'Tours', 'Service Reservation': 'Tours', 'Rules': 'Tours',
    // Booking & CRM
    'CRM': 'CRM', 'CRM Manager': 'CRM', 'Booking | Request': 'CRM',
    'Market': 'CRM', 'Form Issue': 'CRM', 'Form Submit': 'CRM',
    'Frequently Asked Question Manager': 'CRM',
    // Templates & Content
    'Proposal Config': 'Templates', 'Invoice Template Config': 'Templates',
    'Layout Template': 'Templates', 'Templates B2B Setting': 'Templates', 'CMS Manager': 'Templates',
    // Travel Data
    'Geo Path': 'Travel', 'Airport': 'Travel', 'Flight Data Management': 'Travel',
    // System
    'File Manager Localhost': 'System', 'Source Configuration': 'System',
    'System Configure': 'System', 'System Setting Text View': 'System',
  };

  private readonly GROUP_CONFIG = [
    { key: 'Email',     label: 'Email & Communication', icon: 'bi bi-envelope' },
    { key: 'Tariff',    label: 'Tariff & Pricing',      icon: 'bi bi-currency-exchange' },
    { key: 'Tours',     label: 'Tours & Services',      icon: 'bi bi-map' },
    { key: 'CRM',       label: 'Booking & CRM',         icon: 'bi bi-people' },
    { key: 'Templates', label: 'Templates & Content',   icon: 'bi bi-file-earmark-richtext' },
    { key: 'Travel',    label: 'Travel Data',            icon: 'bi bi-geo-alt' },
    { key: 'System',    label: 'System',                 icon: 'bi bi-gear-wide-connected' },
  ];

  constructor(
    private _userService: UserService,
    private dialog: MatDialog
  ) {
    this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: any) => {
      if (user) {
        this.loadFeatureFlags()
        this.user = user;
        let tempMenuSetting = orderBy(menuSetting, 'name', 'asc');
        this.menuUsers = orderBy(menuUsers, 'name', 'asc');

        if (this.user.IsProduct || this.user.IsOm) {
          this.listMenu = tempMenuSetting.filter((x) => x.product);
        } else if (this.user.IsAdmin) {
          this.listMenu = tempMenuSetting;
        }
        if (!this.user?.supperAdmin || user?.IsAdminSystem) {
          this.listMenu = this.listMenu.filter((x) => !x.supplerAdmin);
          for (const item of this.listMenu) {
            if (item.url == 'configuration/tariff-users') {
              this.listMenu.splice(this.listMenu.indexOf(item), 1);
            }
          }
        }
        this.groupedMenu = this.buildGroupedMenu(this.listMenu);
        this.filteredGroupedMenu = [...this.groupedMenu];
      }
    });
  }

  buildGroupedMenu(items: any[]): any[] {
    return this.GROUP_CONFIG
      .map(g => ({
        ...g,
        items: items.filter(x => this.GROUP_MAP[x.name] === g.key),
      }))
      .filter(g => g.items.length > 0);
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
  loadFeatureFlags() {
    // Subscribe to feature flag changes
    this._featureFlagService.featureFlags$.pipe(takeUntil(this._unsubscribeAll)).subscribe(async (flags: any) => {
      this.feature = flags;
    });
  }

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
