import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { UserComponent } from 'app/layout/common/user/user.component';

import { SharedModule } from 'app/shared/shared.module';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
@NgModule({
  declarations: [UserComponent],
  imports: [MatButtonModule, RichTextEditorAllModule, MatDividerModule, MatIconModule, MatMenuModule, SharedModule],
  exports: [UserComponent],
})
export class UserModule {}
