import { Route } from '@angular/router';
import { AssignVsEmailSupplierListComponent } from './list/list.component';
import { AssignVsEmailSupplierDetailComponent } from './detail/detail.component';
export const AssignVsEmailSupplierRoutes: Route[] = [
  {
    path: 'list',
    component: AssignVsEmailSupplierListComponent
  },
  {
    path: 'detail',
    component: AssignVsEmailSupplierDetailComponent
  },
];
