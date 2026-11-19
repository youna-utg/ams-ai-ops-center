import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  NAV_ITEMS,
  NavTab,
} from '../../core/config/navigation.config';

/**
 * Lightweight placeholder for non-Overview destinations.
 */
@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './placeholder.page.html',
  styleUrl: './placeholder.page.scss',
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly path = toSignal(
    this.route.data.pipe(map((data) => (data['navPath'] as string) ?? '')),
    { initialValue: '' },
  );

  private readonly requestedTab = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('tab') ?? '')),
    { initialValue: '' },
  );

  readonly item = computed(() => {
    const path = this.path();
    return NAV_ITEMS.find((nav) => nav.path === path);
  });

  readonly tabs = computed(() => this.item()?.tabs ?? []);

  readonly activeTab = computed<NavTab | undefined>(() => {
    const tabs = this.tabs();
    const requested = this.requestedTab();
    return tabs.find((tab) => tab.id === requested) ?? tabs.at(0);
  });

  readonly plannedSections = computed(
    () =>
      this.activeTab()?.plannedSections ??
      this.item()?.plannedSections ??
      [],
  );

  protected selectAdjacentTab(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const tabs = this.tabs();
    if (tabs.length < 2) {
      return;
    }

    event.preventDefault();
    const current = Math.max(
      0,
      tabs.findIndex((tab) => tab.id === this.activeTab()?.id),
    );
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : event.key === 'ArrowRight'
            ? (current + 1) % tabs.length
            : (current - 1 + tabs.length) % tabs.length;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabs[target].id },
    });
  }
}
