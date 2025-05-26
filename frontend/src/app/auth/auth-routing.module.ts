import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { LoggedInGuard } from './logged-in.guard';

const routes: Routes = [
    { path: 'login', component: LoginComponent, canActivate: [LoggedInGuard] },
    { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [LoggedInGuard] },
    { path: 'reset-password/:token', component: ResetPasswordComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
