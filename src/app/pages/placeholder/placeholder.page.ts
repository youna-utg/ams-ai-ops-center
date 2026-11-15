import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NAV_ITEMS } from '../../core/config/navigation.config';

/**
 * Lightweight placeholder for non-Overview destinations.
 */
@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  templateUrl: './placeholder.page.html',
  styleUrl: './placeholder.page.scss',
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  private readonly path = toSignal(
    this.route.data.pipe(map((data) => (data['navPath'] as string) ?? '')),
    { initialValue: '' },
  );

  readonly item = computed(() => {
    const path = this.path();
    return NAV_ITEMS.find((nav) => nav.path === path);
  });
}
