import { DOCUMENT } from '@angular/common';
import {
  Component,
  HostListener,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { NAV_ITEMS } from '../../core/config/navigation.config';
import { PageContextService } from '../../core/services/page-context.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly pageContext = inject(PageContextService);

  readonly menuToggle = output<void>();
  protected readonly searchQuery = signal('');
  protected readonly activeMenu = signal<'notifications' | 'profile' | null>(
    null,
  );

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
    { initialValue: '/overview' },
  );

  protected readonly currentItem = computed(
    () =>
      NAV_ITEMS.find(
        (item) =>
          item.path === this.currentUrl() ||
          this.currentUrl().startsWith(`${item.path}/`),
      ) ?? NAV_ITEMS[0],
  );

  protected readonly userCrumb = computed(() => {
    const url = this.currentUrl();
    if (url === '/users/import') return 'import' as const;
    return /^\/users\/([^/?]+)/.exec(url) ? ('detail' as const) : null;
  });

  protected readonly userName = computed(() =>
    this.userCrumb() === 'detail' ? this.pageContext.userName() || '사용자를 찾을 수 없습니다' : '',
  );

  protected readonly userListQuery = computed(() => {
    this.currentUrl();
    const params = { ...this.router.parseUrl(this.router.url).queryParams };
    for (const key of [
      'tab',
      'usageProduct',
      'usageFrom',
      'usageTo',
      'historyAction',
      'historyFrom',
      'historyTo',
    ]) {
      delete params[key];
    }
    return params;
  });

  protected readonly productName = computed(() => {
    const match = /^\/products\/([^/?]+)/.exec(this.currentUrl());
    return match ? this.pageContext.productName() || '제품을 찾을 수 없습니다' : '';
  });

  protected readonly productListQuery = computed(() => {
    this.currentUrl();
    const params = { ...this.router.parseUrl(this.router.url).queryParams };
    for (const key of ['tab', 'ai', 'mapQ', 'mapProvider', 'mapModel', 'mapStatus', 'historyAction', 'historyFrom', 'historyTo']) {
      delete params[key];
    }
    return params;
  });

  protected readonly providerName = computed(() => {
    const match = /^\/providers-models\/providers\/([^/?]+)/.exec(this.currentUrl());
    return match ? this.pageContext.providerName() || 'Provider를 찾을 수 없습니다' : '';
  });

  protected readonly providerListQuery = computed(() => {
    this.currentUrl();
    const params = { ...this.router.parseUrl(this.router.url).queryParams };
    const listTab = params['listTab'];
    delete params['listTab'];
    delete params['section'];
    if (listTab === 'models') params['tab'] = 'models';
    return params;
  });

  protected readonly organizationName = computed(() => {
    const match = /^\/organizations\/([^/?]+)/.exec(this.currentUrl());
    return match
      ? this.pageContext.organizationName() || 'Organization'
      : '';
  });

  protected readonly organizationListQuery = computed(() => {
    this.currentUrl();
    const params = { ...this.router.parseUrl(this.router.url).queryParams };
    for (const key of [
      'tab',
      'team',
      'userQ',
      'userStatus',
      'historyTab',
      'historyProduct',
      'historyType',
      'historyQ',
    ]) {
      delete params[key];
    }
    return params;
  });

  protected readonly searchResults = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return [];
    }

    return NAV_ITEMS.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(query),
    ).slice(0, 6);
  });

  protected updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected toggleMenu(menu: 'notifications' | 'profile'): void {
    this.activeMenu.update((current) => (current === menu ? null : menu));
  }

  protected closeMenus(): void {
    this.activeMenu.set(null);
    this.clearSearch();
  }

  @HostListener('document:keydown', ['$event'])
  protected handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.document.querySelector<HTMLInputElement>('#global-search')?.focus();
    }

    if (event.key === 'Escape') {
      this.closeMenus();
      this.document.querySelector<HTMLInputElement>('#global-search')?.blur();
    }
  }
}
