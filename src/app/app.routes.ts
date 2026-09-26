import { Routes } from '@angular/router';
import { DashboardPage } from './presentation/dashboard-page/dashboard-page';
import { LandingPage } from './presentation/landing-page/landing-page';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'dashboard', component: DashboardPage },
];
