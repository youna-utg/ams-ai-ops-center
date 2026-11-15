import { Routes } from '@angular/router';
import { NAV_ITEMS } from './core/config/navigation.config';
import { ShellComponent } from './layout/shell/shell.component';
import { OverviewPage } from './pages/overview/overview.page';
import { PlaceholderPage } from './pages/placeholder/placeholder.page';

const placeholderRoutes: Routes = NAV_ITEMS.filter(
  (item) => item.path !== '/overview',
).map((item) => ({
  path: item.path.slice(1),
  component: PlaceholderPage,
  data: { navPath: item.path },
}));

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', component: OverviewPage },
      ...placeholderRoutes,
    ],
  },
  { path: '**', redirectTo: 'overview' },
];
