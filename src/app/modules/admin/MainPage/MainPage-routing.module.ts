import { Route } from '@angular/router';
import { MainPageComponent } from './main-page.component';
import { MainPageDashboardComponent } from './main-page-dashboard.component';
import { MainPagePanelManagerComponent } from './main-page-panel-manager.component';

export const MainPageRoutes: Route[] = [
	{
		path: '',
		component: MainPageComponent,
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'dashboard',
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
