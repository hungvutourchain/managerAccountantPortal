import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FuseCardModule } from "@fuse/components/card";
import { FuseAlertModule } from "@fuse/components/alert";
import { SharedModule } from "app/shared/shared.module";
import { AuthSignInComponent } from "app/modules/auth/sign-in/sign-in.component";
import { authSignInRoutes } from "app/modules/auth/sign-in/sign-in.routing";
import { NgOtpInputModule } from "ng-otp-input";
import { SocialAuthServiceConfig, GoogleLoginProvider } from 'angularx-social-login';

@NgModule({
  declarations: [AuthSignInComponent],
  imports: [
    RouterModule.forChild(authSignInRoutes),
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FuseCardModule,
    FuseAlertModule,
    SharedModule,
    NgOtpInputModule,
  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('YOUR_GOOGLE_CLIENT_ID')
          }
        ]
      } as SocialAuthServiceConfig,
    }
  ],
})
export class AuthSignInModule { }
