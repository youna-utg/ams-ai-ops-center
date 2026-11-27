import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ProductsStore } from '../products/data/products.store';
import {
  CatalogModel,
  CatalogProvider,
  CatalogStatus,
  ProviderKind,
} from '../products/models/product.models';

type TabId = 'providers' | 'models';
type SortDirection = 'asc' | 'desc';
type DialogId = 'provider' | 'model' | 'view-model' | 'confirm' | null;

interface ListParams {
  tab: TabId;
  q: string;
  status: 'all' | CatalogStatus;
  kind: 'all' | ProviderKind;
  provider: string;
  sort: string;
  direction: SortDirection;
  page: number;
}

@Component({
  selector: 'app-provider-list-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './provider-list.page.html',
  styleUrl: './provider-list.page.scss',
})
export class ProviderListPage {
  protected readonly store = inject(ProductsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs = [
    { id: 'providers' as const, label: 'Providers' },
    { id: 'models' as const, label: 'Models' },
  ];
  protected readonly params = signal<ListParams>({
    tab: 'providers',
    q: '',
    status: 'all',
    kind: 'all',
    provider: 'all',
    sort: 'name',
    direction: 'asc',
    page: 1,
  });
  protected readonly dialog = signal<DialogId>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly providerKind = signal<ProviderKind>('llm');
  protected readonly modelProviderId = signal('');
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  protected readonly actionMenu = signal<string | null>(null);
  protected readonly actionMenuStyle = signal<{ top: string; left: string } | null>(null);
  private toastTimer = 0;

  protected readonly providerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.maxLength(40)]],
    kind: ['llm' as ProviderKind, Validators.required],
    description: ['', Validators.maxLength(300)],
    endpoint: ['', Validators.maxLength(200)],
    status: ['inactive' as CatalogStatus, Validators.required],
  });
  protected readonly modelForm = this.formBuilder.nonNullable.group({
    providerId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', Validators.maxLength(300)],
    status: ['inactive' as CatalogStatus, Validators.required],
  });

  protected readonly providerSummary = computed(() => {
    const providers = this.store.providers();
    return {
      total: providers.length,
      active: providers.filter((item) => item.status === 'active').length,
      llm: providers.filter((item) => item.kind === 'llm').length,
      nonLlm: providers.filter((item) => item.kind === 'non-llm').length,
    };
  });
  protected readonly modelSummary = computed(() => {
    const models = this.store.models();
    return {
      total: models.length,
      active: models.filter((item) => item.status === 'active').length,
      inactive: models.filter((item) => item.status === 'inactive').length,
    };
  });
  protected readonly filteredProviders = computed(() => {
    const params = this.params();
    const query = params.q.trim().toLowerCase();
    const rows = this.store.providers().filter((provider) => {
      const matchesQuery = !query || provider.name.toLowerCase().includes(query) || provider.code.toLowerCase().includes(query);
      const matchesStatus = params.status === 'all' || provider.status === params.status;
      const matchesKind = params.kind === 'all' || provider.kind === params.kind;
      return matchesQuery && matchesStatus && matchesKind;
    });
    return this.sorted(rows, params, (provider, sort) => this.providerValue(provider, sort));
  });
  protected readonly filteredModels = computed(() => {
    const params = this.params();
    const query = params.q.trim().toLowerCase();
    const rows = this.store.models().filter((model) => {
      const matchesQuery = !query || model.name.toLowerCase().includes(query) || model.code.toLowerCase().includes(query);
      const matchesStatus = params.status === 'all' || model.status === params.status;
      const matchesKind = params.kind === 'all' || model.kind === params.kind;
      const matchesProvider = params.provider === 'all' || model.providerId === params.provider;
      return matchesQuery && matchesStatus && matchesKind && matchesProvider;
    });
    return this.sorted(rows, params, (model, sort) => this.modelValue(model, sort));
  });
  protected readonly activeRows = computed(() => (this.params().tab === 'providers' ? this.filteredProviders() : this.filteredModels()));
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.activeRows().length / 10)));
  protected readonly currentPage = computed(() => Math.min(this.params().page, this.totalPages()));
  protected readonly pagedProviders = computed(() => this.pageOf(this.filteredProviders()));
  protected readonly pagedModels = computed(() => this.pageOf(this.filteredModels()));
  protected readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, index) => index + 1));
  protected readonly hasFilters = computed(() => Boolean(this.params().q || this.params().status !== 'all' || this.params().kind !== 'all' || (this.params().tab === 'models' && this.params().provider !== 'all')));
  protected readonly viewedModel = computed(() => this.store.modelById(this.editingId() ?? '') ?? null);
  protected readonly viewedLinks = computed(() => {
    const model = this.viewedModel();
    if (!model) return [];
    return this.store.mappings().filter((mapping) => mapping.modelId === model.id);
  });
  protected readonly confirmCount = computed(() => {
    if (this.dialog() !== 'confirm' || !this.editingId()) return 0;
    const id = this.editingId()!;
    const key = this.params().tab === 'providers' ? 'providerId' : 'modelId';
    return new Set(this.store.mappings().filter((mapping) => mapping[key] === id).map((mapping) => mapping.productId)).size;
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const status = query.get('status');
      const kind = query.get('kind');
      this.params.set({
        tab: query.get('tab') === 'models' ? 'models' : 'providers',
        q: query.get('q') ?? '',
        status: status === 'active' || status === 'inactive' ? status : 'all',
        kind: kind === 'llm' || kind === 'non-llm' ? kind : 'all',
        provider: query.get('provider') ?? 'all',
        sort: query.get('sort') ?? 'name',
        direction: query.get('direction') === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, Number(query.get('page') ?? 1) || 1),
      });
    });
    const syncMenu = () => this.syncActionMenu();
    document.addEventListener('scroll', syncMenu, true);
    window.addEventListener('resize', syncMenu);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('scroll', syncMenu, true);
      window.removeEventListener('resize', syncMenu);
      window.clearTimeout(this.toastTimer);
    });
  }

  @HostListener('document:click', ['$event'])
  protected closeMenu(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element) || target.closest('.icon-action, .action-menu')) return;
    this.actionMenu.set(null);
    this.actionMenuStyle.set(null);
  }

  protected setTab(tab: TabId): void {
    this.actionMenu.set(null);
    this.navigate({ tab, q: '', status: 'all', kind: 'all', provider: 'all', sort: 'name', direction: 'asc', page: 1 });
  }

  protected updateQuery(value: string): void {
    this.navigate({ ...this.params(), q: value, page: 1 });
  }

  protected updateFilter(key: 'status' | 'kind' | 'provider', value: string): void {
    this.navigate({ ...this.params(), [key]: value || 'all', page: 1 });
  }

  protected clearFilters(): void {
    this.navigate({ ...this.params(), q: '', status: 'all', kind: 'all', provider: 'all', page: 1 });
  }

  protected sortBy(sort: string): void {
    const current = this.params();
    this.navigate({ ...current, sort, direction: current.sort === sort && current.direction === 'asc' ? 'desc' : 'asc', page: 1 });
  }

  protected changePage(page: number): void {
    this.navigate({ ...this.params(), page });
  }

  protected detailQuery(extra: Params = {}): Params {
    const params = this.params();
    const query: Params = { ...extra };
    if (params.tab === 'models') query['listTab'] = 'models';
    if (params.q) query['q'] = params.q;
    if (params.status !== 'all') query['status'] = params.status;
    if (params.kind !== 'all') query['kind'] = params.kind;
    if (params.provider !== 'all') query['provider'] = params.provider;
    if (params.sort !== 'name') query['sort'] = params.sort;
    if (params.direction !== 'asc') query['direction'] = params.direction;
    if (params.page > 1) query['page'] = params.page;
    return query;
  }

  protected openProvider(provider?: CatalogProvider): void {
    this.actionMenu.set(null);
    this.providerForm.reset({
      name: provider?.name ?? '',
      code: provider?.code ?? '',
      kind: provider?.kind ?? 'llm',
      description: provider?.description ?? '',
      endpoint: provider?.endpoint ?? '',
      status: provider?.status ?? 'inactive',
    });
    if (provider) {
      this.providerForm.controls.code.disable();
      this.providerForm.controls.kind.disable();
      this.providerForm.controls.status.disable();
    } else {
      this.providerForm.controls.code.enable();
      this.providerForm.controls.kind.enable();
      this.providerForm.controls.status.enable();
    }
    this.providerKind.set(provider?.kind ?? 'llm');
    this.editingId.set(provider?.id ?? null);
    this.formError.set('');
    this.dialog.set('provider');
  }

  protected changeProviderKind(event: Event): void {
    const kind = event.target instanceof HTMLSelectElement && event.target.value === 'non-llm' ? 'non-llm' : 'llm';
    this.providerKind.set(kind);
    this.providerForm.controls.kind.setValue(kind);
  }

  protected saveProvider(): void {
    this.providerForm.markAllAsTouched();
    if (this.providerForm.invalid) {
      this.formError.set('Provider명, Provider Code, Provider Type을 확인해 주세요.');
      return;
    }
    const value = this.providerForm.getRawValue();
    try {
      if (this.editingId()) {
        this.store.updateProvider(this.editingId()!, { name: value.name, description: value.description, endpoint: value.endpoint });
      } else {
        this.store.createProvider(value);
      }
      this.closeDialog();
      this.showToast('Provider를 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Provider를 저장하지 못했습니다.');
    }
  }

  protected openModel(model?: CatalogModel): void {
    this.actionMenu.set(null);
    const providerId = model?.providerId ?? '';
    this.modelForm.reset({
      providerId,
      name: model?.name ?? '',
      code: model?.code ?? '',
      description: model?.description ?? '',
      status: model?.status ?? 'inactive',
    });
    if (model) {
      this.modelForm.controls.providerId.disable();
      this.modelForm.controls.code.disable();
      this.modelForm.controls.status.disable();
    } else {
      this.modelForm.controls.providerId.enable();
      this.modelForm.controls.code.enable();
      this.modelForm.controls.status.enable();
    }
    this.modelProviderId.set(providerId);
    this.editingId.set(model?.id ?? null);
    this.formError.set('');
    this.dialog.set('model');
  }

  protected changeModelProvider(event: Event): void {
    const providerId = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.modelProviderId.set(providerId);
    this.modelForm.controls.providerId.setValue(providerId);
  }

  protected saveModel(): void {
    this.modelForm.markAllAsTouched();
    if (this.modelForm.invalid) {
      this.formError.set('Provider, Model명, Model Code를 확인해 주세요.');
      return;
    }
    const value = this.modelForm.getRawValue();
    try {
      if (this.editingId()) this.store.updateModel(this.editingId()!, { name: value.name, description: value.description });
      else this.store.createModel(value);
      this.closeDialog();
      this.showToast('Model을 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Model을 저장하지 못했습니다.');
    }
  }

  protected openModelView(model: CatalogModel): void {
    this.actionMenu.set(null);
    this.editingId.set(model.id);
    this.formError.set('');
    this.dialog.set('view-model');
  }

  protected requestStatus(id: string, active: boolean): void {
    this.actionMenu.set(null);
    if (active) {
      this.applyStatus(id, 'active');
      return;
    }
    this.editingId.set(id);
    this.dialog.set('confirm');
  }

  protected confirmStatus(): void {
    const id = this.editingId();
    if (!id) return;
    this.applyStatus(id, 'inactive');
    this.closeDialog();
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    this.formError.set('');
  }

  protected toggleActionMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = this.actionMenu() === id ? null : id;
    this.actionMenu.set(next);
    if (!next || !(event.currentTarget instanceof HTMLElement)) {
      this.actionMenuStyle.set(null);
      return;
    }
    this.placeActionMenu(event.currentTarget);
  }

  protected openProviderFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button')) return;
    this.openProviderDetail(id, event);
  }

  protected openProviderDetail(id: string, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/providers-models/providers', id], { queryParams: this.detailQuery() });
  }

  protected openModelDetail(id: string, event: Event): void {
    event.stopPropagation();
    this.openModelViewById(id);
  }

  protected openModelFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button')) return;
    const model = this.store.modelById(id);
    if (model) this.openModelView(model);
  }

  protected menuRecord(): CatalogProvider | CatalogModel | undefined {
    const id = this.actionMenu();
    if (!id) return undefined;
    return this.params().tab === 'providers' ? this.store.providerById(id) : this.store.modelById(id);
  }

  protected modelCount(providerId: string): number {
    return this.store.models().filter((model) => model.providerId === providerId).length;
  }

  protected providerProductCount(providerId: string): number {
    return new Set(this.store.mappings().filter((mapping) => mapping.providerId === providerId).map((mapping) => mapping.productId)).size;
  }

  protected modelProductCount(modelId: string): number {
    return new Set(this.store.mappings().filter((mapping) => mapping.modelId === modelId).map((mapping) => mapping.productId)).size;
  }

  protected kindLabel(kind: ProviderKind): string {
    return kind === 'llm' ? 'LLM' : 'Non-LLM';
  }

  protected modelTypeLabel(): string {
    const provider = this.store.providerById(this.modelProviderId());
    return provider ? this.kindLabel(provider.kind) : 'Provider를 선택하면 정해집니다.';
  }

  protected openModelViewById(id: string): void {
    const model = this.store.modelById(id);
    if (model) this.openModelView(model);
  }

  protected statusLabel(status: CatalogStatus): string {
    return status === 'active' ? '활성' : '비활성';
  }

  protected productLink(productId: string, kind: ProviderKind): Params {
    return kind === 'non-llm' ? { tab: 'configuration', ai: 'non-llm' } : { tab: 'configuration' };
  }

  private applyStatus(id: string, status: CatalogStatus): void {
    if (this.params().tab === 'providers') this.store.setProviderStatus(id, status);
    else this.store.setModelStatus(id, status);
    this.showToast(status === 'active' ? '활성화했습니다.' : '비활성화했습니다.');
  }

  private providerValue(provider: CatalogProvider, sort: string): string | number {
    if (sort === 'code') return provider.code;
    if (sort === 'type') return provider.kind;
    if (sort === 'models') return this.modelCount(provider.id);
    if (sort === 'products') return this.providerProductCount(provider.id);
    if (sort === 'status') return provider.status;
    if (sort === 'updated') return provider.updatedAt;
    return provider.name;
  }

  private modelValue(model: CatalogModel, sort: string): string | number {
    if (sort === 'code') return model.code;
    if (sort === 'provider') return this.store.providerName(model.providerId);
    if (sort === 'type') return model.kind;
    if (sort === 'products') return this.modelProductCount(model.id);
    if (sort === 'status') return model.status;
    if (sort === 'updated') return model.updatedAt;
    return model.name;
  }

  private sorted<T>(rows: readonly T[], params: ListParams, valueOf: (row: T, sort: string) => string | number): T[] {
    const direction = params.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
      const a = valueOf(left, params.sort);
      const b = valueOf(right, params.sort);
      const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'ko');
      return result * direction;
    });
  }

  private pageOf<T>(rows: readonly T[]): T[] {
    const page = Math.min(this.currentPage(), Math.max(1, Math.ceil(rows.length / 10)));
    return rows.slice((page - 1) * 10, page * 10);
  }

  private navigate(params: ListParams): void {
    const query: Params = {};
    if (params.tab === 'models') query['tab'] = 'models';
    if (params.q) query['q'] = params.q;
    if (params.status !== 'all') query['status'] = params.status;
    if (params.kind !== 'all') query['kind'] = params.kind;
    if (params.provider !== 'all') query['provider'] = params.provider;
    if (params.sort !== 'name') query['sort'] = params.sort;
    if (params.direction !== 'asc') query['direction'] = params.direction;
    if (params.page > 1) query['page'] = String(params.page);
    void this.router.navigate([], { relativeTo: this.route, queryParams: query });
  }

  private placeActionMenu(button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const menuWidth = 148;
    const menuHeight = 110;
    const gap = 6;
    const openAbove = rect.bottom + gap + menuHeight > window.innerHeight && rect.top > menuHeight + gap;
    const top = openAbove ? rect.top - gap - menuHeight : rect.bottom + gap;
    const left = Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8);
    this.actionMenuStyle.set({ top: `${top}px`, left: `${left}px` });
  }

  private syncActionMenu(): void {
    if (!this.actionMenu()) return;
    const button = document.querySelector<HTMLElement>('.icon-action[aria-expanded="true"]');
    if (!button) {
      this.actionMenu.set(null);
      this.actionMenuStyle.set(null);
      return;
    }
    this.placeActionMenu(button);
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 2400);
  }
}
