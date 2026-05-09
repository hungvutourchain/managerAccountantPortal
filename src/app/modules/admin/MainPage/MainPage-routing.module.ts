import { Route } from '@angular/router';
import { MainPageComponent } from './main-page.component';
import { MainPageDashboardComponent } from './main-page-dashboard.component';
import { MainPagePanelManagerComponent } from './main-page-panel-manager.component';
import { CustomerManagementComponent } from './customer-management.component';
import { DebtManagementComponent } from './debt-management.component';
import { ReportCenterComponent } from './report-center.component';

export const MainPageRoutes: Route[] = [
	{
		path: '',
		component: MainPageComponent,
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'customer-management',
			},
			{
				path: 'customer-management',
				component: CustomerManagementComponent,
			},
			{
				path: 'debt-management',
				component: DebtManagementComponent,
			},
			{
				path: 'report-center',
				component: ReportCenterComponent,
			},
			{
				path: 'dashboard',
				component: MainPageDashboardComponent,
			},
			{
				path: 'panel-manager',
				component: MainPagePanelManagerComponent,
			},
		],
	},
];
