import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { NAV_ITEMS } from './core/config/navigation.config';
import { ShellComponent } from './layout/shell/shell.component';
import { OverviewPage } from './pages/overview/overview.page';
import { PlaceholderPage } from './pages/placeholder/placeholder.page';

const placeholderRoutes: Routes = NAV_ITEMS.filter(
  (item) => !['/overview', '/organizations', '/users', '/products', '/plans-points', '/providers-models', '/usage-costs', '/admin-permissions', '/activity-history', '/system-monitoring', '/settings'].includes(item.path),
).map((item) => ({
  path: item.path.slice(1),
  component: PlaceholderPage,
  data: { navPath: item.path },
}));

const legacyRoutes: Routes = [
  { path: 'plans', redirectTo: 'plans-points' },
  {
    path: 'point-policies',
    redirectTo: () =>
      inject(Router).createUrlTree(['/plans-points'], {
        queryParams: { tab: 'point-policies' },
      }),
  },
  {
    path: 'api-usage',
    redirectTo: () =>
      inject(Router).createUrlTree(['/usage-costs'], {
        queryParams: { tab: 'api-usage' },
      }),
  },
  {
    path: 'cost-analytics',
    redirectTo: () =>
      inject(Router).createUrlTree(['/usage-costs'], {
        queryParams: { tab: 'cost-analytics' },
      }),
  },
  {
    path: 'rate-cards',
    redirectTo: () =>
      inject(Router).createUrlTree(['/usage-costs'], {
        queryParams: { tab: 'rate-cards' },
      }),
  },
  {
    path: 'admin-accounts',
    redirectTo: () =>
      inject(Router).createUrlTree(['/admin-permissions'], {
        queryParams: { tab: 'admin-accounts' },
      }),
  },
  {
    path: 'roles-permissions',
    redirectTo: () =>
      inject(Router).createUrlTree(['/admin-permissions'], {
        queryParams: { tab: 'permissions' },
      }),
  },
  {
    path: 'system-health',
    redirectTo: () =>
      inject(Router).createUrlTree(['/system-monitoring'], {
        queryParams: { tab: 'health' },
      }),
  },
  {
    path: 'system-logs',
    redirectTo: () =>
      inject(Router).createUrlTree(['/system-monitoring'], {
        queryParams: { tab: 'system-logs' },
      }),
  },
];

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', component: OverviewPage },

      {
        path: 'organizations',
        loadComponent: () =>
          import(
            './pages/organizations/organization-list/organization-list.page'
          ).then((page) => page.OrganizationListPage),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/product-list/product-list.page').then(
            (page) => page.ProductListPage,
          ),
      },
      {
        path: 'products/:productId',
        loadComponent: () =>
          import('./pages/products/product-detail/product-detail.page').then(
            (page) => page.ProductDetailPage,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/user-list/user-list.page').then(
            (page) => page.UserListPage,
          ),
      },
      {
        path: 'users/import',
        loadComponent: () =>
          import('./pages/users/user-import/user-import.page').then(
            (page) => page.UserImportPage,
          ),
      },
      {
        path: 'users/:userId',
        loadComponent: () =>
          import('./pages/users/user-detail/user-detail.page').then(
            (page) => page.UserDetailPage,
          ),
      },
      {
        path: 'providers-models',
        loadComponent: () =>
          import('./pages/providers/provider-list.page').then((page) => page.ProviderListPage),
      },
      {
        path: 'providers-models/providers/:providerId',
        loadComponent: () =>
          import('./pages/providers/provider-detail.page').then((page) => page.ProviderDetailPage),
      },
      {
        path: 'admin-permissions',
        loadComponent: () =>
          import('./pages/admin/admin-permissions.page').then((page) => page.AdminPermissionsPage),
      },
      {
        path: 'activity-history',
        loadComponent: () =>
          import('./pages/activity/activity-history.page').then((page) => page.ActivityHistoryPage),
      },
      {
        path: 'system-monitoring',
        loadComponent: () =>
          import('./pages/monitoring/system-monitoring.page').then((page) => page.SystemMonitoringPage),
      },
      {
        path: 'settings',
        canDeactivate: [(component: { canLeave: () => boolean | Promise<boolean> }) => component.canLeave()],
        loadComponent: () =>
          import('./pages/settings/settings.page').then((page) => page.SettingsPage),
      },
      {
        path: 'usage-costs',
        loadComponent: () =>
          import('./pages/usage/usage-costs.page').then((page) => page.UsageCostsPage),
      },
      {
        path: 'plans-points',
        loadComponent: () =>
          import('./pages/plans/plans-points.page').then((page) => page.PlansPointsPage),
      },
      {
        path: 'organizations/:organizationId',
        loadComponent: () =>
          import(
            './pages/organizations/organization-detail/organization-detail.page'
          ).then((page) => page.OrganizationDetailPage),
      },
      ...placeholderRoutes,
      ...legacyRoutes,
    ],
  },
  { path: '**', redirectTo: 'overview' },
];
