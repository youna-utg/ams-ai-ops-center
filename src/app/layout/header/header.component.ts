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
      NAV_ITEMS.find((item) => item.path === this.currentUrl()) ?? NAV_ITEMS[0],
  );

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
