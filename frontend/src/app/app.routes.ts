import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { RegisterComponent } from './auth/register/register.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './auth/auth.guard';
import { AuthRedirectGuard } from './auth/guards/auth-redirect.guard';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { ProfileComponent } from './profile/profile.component';
import { UsersComponent } from './users/users.component';
import { CommissionerGuard } from './auth/commissioner.guard';
import { CommissionerPanelComponent } from './commissioner-panel/commissioner-panel.component';
import { ClientReportComponent } from './commissioner-panel/client-report/client-report.component';
import { AdminAnalyticsComponent } from './admin-analytics/admin-analytics.component';
import { FundsComponent } from './funds/funds.component';
import { NotificationsComponent } from './notifications/notifications.component';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent, canActivate: [AuthRedirectGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'register', component: RegisterComponent, canActivate: [AuthRedirectGuard] },
  { path: 'portfolio', component: PortfolioComponent},
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: 'test-reset-password', component: ResetPasswordComponent },
  { path: 'dashboard', component: DashboardComponent },
  { 
    path: 'markets', 
    loadChildren: () => import('./markets/markets.module').then(m => m.MarketsModule),
  },
  { path: 'profile', component: ProfileComponent },
  //Ruta del analista 
  {path: 'admin-analytics', component: AdminAnalyticsComponent},
  // Rutas del panel de comisionista y usuarios
  { path: 'users', component: UsersComponent },
  { path: 'commissioner-panel', component: CommissionerPanelComponent },
  { path: 'commissioner-panel/client/:id', component: ClientReportComponent },
  { path: 'funds', component: FundsComponent},
  { path: 'notifications', component: NotificationsComponent },
  { path: '**', redirectTo: 'home' }
];
