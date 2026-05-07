import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { inMaintenanceRoutes } from './in-maintenance.routing';
import { InMaintenanceComponent } from './in-maintenance.component';

@NgModule({
  declarations: [InMaintenanceComponent],
  imports: [
    RouterModule.forChild(inMaintenanceRoutes),
  ],
})
export class InMaintenanceModule {}
