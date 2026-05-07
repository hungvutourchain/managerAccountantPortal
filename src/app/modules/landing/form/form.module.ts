import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from 'app/shared/shared.module';
import { FormComponent } from 'app/modules/landing/form/form.component';
import { FormRoutes } from 'app/modules/landing/form/form.routing';

@NgModule({
    declarations: [
        FormComponent
    ],
    imports     : [
        RouterModule.forChild(FormRoutes),
        MatButtonModule,
        MatIconModule,
        SharedModule
    ]
})
export class FormModule
{
}
