import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/components/status-badge/status-badge.component';
import { USAGE_CLOCK, formatKst, kstDay, shiftDate } from '../usage/data/usage-dates';
import { ActivityFeed } from './data/activity-feed';
import { ActivityCategory, ActivityModule, ActivityView } from './models/activity.models';

type RangeId = '1' | '7' | '30' | 'custom';
type SortKey = 'timestamp' | 'module' | 'action' | 'actor';

interface ListParams {
  range: RangeId;
  from: string;
  to: string;
  module: ActivityModule | 'all';
  action: ActivityCategory | 'all';
  actor: string;
  q: string;
  sort: SortKey;
  direction: 'asc' | 'desc';
  page: number;
  size: 10 | 20 | 50;
}

const MODULES: readonly ActivityModule[] = [
  'organizations',
  'users',
  'products',
  'plans-points',
  'providers-models',
  'usage-costs',
  'admin-permissions',
  'system-monitoring',
  'settings',
];

const ACTIONS: readonly ActivityCategory[] = [
  'created',
  'updated',
  'status-changed',
  'added',
  'removed',
  'activated',
  'deactivated',
  'permission-changed',
];

@Component({
  selector: 'app-activity-history-page',
  standalone: true,
  imports: [RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './activity-history.page.html',
  styleUrl: './activity-history.page.scss',
})
export class ActivityHistoryPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly feed = inject(ActivityFeed);
  protected readonly clock = USAGE_CLOCK;
  protected readonly ranges = [
    { id: '1' as const, label: 'Today' },
    { id: '7' as const, label: 'Last 7 Days' },
    { id: '30' as const, label: 'Last 30 Days' },
    { id: 'custom' as const, label: 'Custom Range' },
  ];
  protected readonly params = signal<ListParams>({
    range: '30',
    from: shiftDate(USAGE_CLOCK, -29),
    to: USAGE_CLOCK,
    module: 'all',
    action: 'all',
    actor: 'all',
    q: '',
    sort: 'timestamp',
    direction: 'desc',
    page: 1,
    size: 20,
  });
  protected readonly selectedId = signal<string | null>(null);
  protected readonly toast = signal('');
  private toastTimer = 0;

  protected readonly moduleOptions = computed(() => {
    const present = new Set(this.feed.events().map((event) => event.module));
    return MODULES.filter((module) => present.has(module)).map((module) => ({
      id: module,
      label: this.feed.events().find((event) => event.module === module)?.moduleLabel ?? module,
    }));
  });
  protected readonly actionOptions = computed(() => {
    const present = new Set(this.feed.events().map((event) => event.category));
    return ACTIONS.filter((action) => present.has(action)).map((action) => ({
      id: action,
      label: this.feed.events().find((event) => event.category === action)?.actionLabel ?? action,
    }));
  });
  protected readonly actorOptions = computed(() => [...new Set(this.feed.events().map((event) => event.actorLabel))].sort((left, right) => left.localeCompare(right, 'ko')));
  protected readonly rows = computed(() => this.filterEvents());
  protected readonly summary = computed(() => ({
    total: this.rows().length,
    actors: new Set(this.rows().map((event) => event.actorLabel)).size,
    modules: new Set(this.rows().map((event) => event.module)).size,
  }));
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.rows().length / this.params().size)));
  protected readonly page = computed(() => Math.min(this.params().page, this.pageCount()));
  protected readonly paged = computed(() => {
    const start = (this.page() - 1) * this.params().size;
    return this.rows().slice(start, start + this.params().size);
  });
  protected readonly selected = computed(() => this.feed.events().find((event) => event.id === this.selectedId()) ?? null);
  protected readonly filtered = computed(() => {
    const params = this.params();
    return params.range !== '30' || params.module !== 'all' || params.action !== 'all' || params.actor !== 'all' || params.q !== '';
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const range = query.get('range');
      const module = query.get('module');
      const action = query.get('action');
      const sort = query.get('sort');
      const size = Number(query.get('size'));
      this.params.set({
        range: range === '1' || range === '7' || range === 'custom' ? range : '30',
        from: query.get('from') || shiftDate(USAGE_CLOCK, -29),
        to: query.get('to') || USAGE_CLOCK,
        module: MODULES.includes(module as ActivityModule) ? module as ActivityModule : 'all',
        action: ACTIONS.includes(action as ActivityCategory) ? action as ActivityCategory : 'all',
        actor: query.get('actor') || 'all',
        q: query.get('q') ?? '',
        sort: sort === 'module' || sort === 'action' || sort === 'actor' ? sort : 'timestamp',
        direction: query.get('dir') === 'asc' ? 'asc' : 'desc',
        page: Math.max(1, Number(query.get('page')) || 1),
        size: size === 10 || size === 50 ? size : 20,
      });
    });
    this.destroyRef.onDestroy(() => window.clearTimeout(this.toastTimer));
  }

  protected setRange(range: RangeId): void {
    const window = range === 'custom'
      ? { from: this.params().from || shiftDate(USAGE_CLOCK, -29), to: this.params().to || USAGE_CLOCK }
      : { from: shiftDate(USAGE_CLOCK, range === '1' ? 0 : range === '7' ? -6 : -29), to: USAGE_CLOCK };
    this.navigate({ ...this.params(), range, ...window, page: 1 });
  }

  protected update(key: 'from' | 'to' | 'module' | 'action' | 'actor' | 'q', value: string): void {
    this.navigate({ ...this.params(), [key]: value, page: 1 });
  }

  protected changeSize(value: string): void {
    const size = Number(value);
    this.navigate({ ...this.params(), size: size === 10 || size === 50 ? size : 20, page: 1 });
  }

  protected clearFilters(): void {
    this.navigate({
      ...this.params(),
      range: '30',
      from: shiftDate(USAGE_CLOCK, -29),
      to: USAGE_CLOCK,
      module: 'all',
      action: 'all',
      actor: 'all',
      q: '',
      page: 1,
    });
  }

  protected refresh(): void {
    this.feed.refresh();
    this.showToast('샘플 활동 목록을 다시 표시했습니다.');
  }

  protected sort(sort: SortKey): void {
    const current = this.params();
    this.navigate({
      ...current,
      sort,
      direction: current.sort === sort && current.direction === 'desc' ? 'asc' : 'desc',
      page: 1,
    });
  }

  protected changePage(page: number): void {
    this.navigate({ ...this.params(), page });
  }

  protected openFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button')) return;
    this.selectedId.set(id);
  }

  protected openDetail(id: string): void {
    this.selectedId.set(id);
  }

  protected closeDetail(): void {
    this.selectedId.set(null);
  }

  protected tone(category: ActivityCategory): StatusTone {
    if (category === 'created' || category === 'activated') return 'success';
    if (category === 'removed') return 'danger';
    if (category === 'deactivated' || category === 'status-changed') return 'warning';
    return 'neutral';
  }

  protected display(value: string | null): string {
    return value === null || value === '' ? '—' : value;
  }

  protected formatStamp(value: string): string {
    return formatKst(value);
  }

  protected pages(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  private filterEvents(): ActivityView[] {
    const params = this.params();
    const window = this.rangeWindow(params);
    const query = params.q.trim().toLowerCase();
    const rows = this.feed.events().filter((event) => {
      const day = kstDay(event.timestamp);
      const matchesRange = day >= window.start && day <= window.end;
      const matchesModule = params.module === 'all' || event.module === params.module;
      const matchesAction = params.action === 'all' || event.category === params.action;
      const matchesActor = params.actor === 'all' || event.actorLabel === params.actor;
      const haystack = [event.targetLabel, event.targetCode ?? '', event.summary, event.actorLabel, event.id].join(' ').toLowerCase();
      return matchesRange && matchesModule && matchesAction && matchesActor && (!query || haystack.includes(query));
    });
    const direction = params.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => this.compare(left, right, params.sort) * direction);
  }

  private compare(left: ActivityView, right: ActivityView, sort: SortKey): number {
    if (sort === 'timestamp') return Date.parse(left.timestamp) - Date.parse(right.timestamp);
    const value = sort === 'module' ? left.moduleLabel : sort === 'action' ? left.actionLabel : left.actorLabel;
    const other = sort === 'module' ? right.moduleLabel : sort === 'action' ? right.actionLabel : right.actorLabel;
    return value.localeCompare(other, 'ko');
  }

  private rangeWindow(params: ListParams): { start: string; end: string } {
    if (params.range === 'custom') {
      return params.from <= params.to ? { start: params.from, end: params.to } : { start: params.to, end: params.from };
    }
    const length = params.range === '1' ? 0 : params.range === '7' ? 6 : 29;
    return { start: shiftDate(USAGE_CLOCK, -length), end: USAGE_CLOCK };
  }

  private navigate(params: ListParams): void {
    const query: Record<string, string | null> = {
      range: params.range === '30' ? null : params.range,
      from: params.range === 'custom' ? params.from : null,
      to: params.range === 'custom' ? params.to : null,
      module: params.module === 'all' ? null : params.module,
      action: params.action === 'all' ? null : params.action,
      actor: params.actor === 'all' ? null : params.actor,
      q: params.q || null,
      sort: params.sort === 'timestamp' ? null : params.sort,
      dir: params.direction === 'desc' ? null : 'asc',
      page: params.page > 1 ? String(params.page) : null,
      size: params.size === 20 ? null : String(params.size),
    };
    void this.router.navigate([], { relativeTo: this.route, queryParams: query });
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 2400);
  }
}
