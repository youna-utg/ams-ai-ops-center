import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { PageContextService } from '../../core/services/page-context.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ProductsStore } from '../products/data/products.store';
import { CatalogModel, CatalogStatus, ProviderKind } from '../products/models/product.models';

type SectionId = 'overview' | 'models' | 'products';
type DialogId = 'provider' | 'model' | 'view-model' | 'confirm' | null;

@Component({
  selector: 'app-provider-detail-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './provider-detail.page.html',
  styleUrl: './provider-detail.page.scss',
})
export class ProviderDetailPage {
  protected readonly store = inject(ProductsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly pageContext = inject(PageContextService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sections = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'models' as const, label: 'Models' },
    { id: 'products' as const, label: 'Products' },
  ];
  private readonly providerId = signal('');
  protected readonly section = signal<SectionId>('overview');
  protected readonly dialog = signal<DialogId>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly modelProviderId = signal('');
  protected readonly confirmTarget = signal<{ kind: 'provider' | 'model'; id: string } | null>(null);
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  protected readonly actionMenu = signal<string | null>(null);
  protected readonly actionMenuStyle = signal<{ top: string; left: string } | null>(null);
  private toastTimer = 0;

  protected readonly providerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    code: [{ value: '', disabled: true }],
    kind: [{ value: 'llm' as ProviderKind, disabled: true }],
    description: ['', Validators.maxLength(300)],
    endpoint: ['', Validators.maxLength(200)],
  });
  protected readonly modelForm = this.formBuilder.nonNullable.group({
    providerId: [{ value: '', disabled: true }, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', Validators.maxLength(300)],
    status: ['inactive' as CatalogStatus, Validators.required],
  });

  protected readonly provider = computed(() => this.store.providerById(this.providerId()) ?? null);
  protected readonly providerModels = computed(() => this.store.models().filter((model) => model.providerId === this.providerId()));
  protected readonly providerMappings = computed(() => this.store.mappings().filter((mapping) => mapping.providerId === this.providerId()));
  protected readonly summary = computed(() => {
    const models = this.providerModels();
    return {
      models: models.length,
      activeModels: models.filter((model) => model.status === 'active').length,
      products: new Set(this.providerMappings().map((mapping) => mapping.productId)).size,
    };
  });
  protected readonly viewedModel = computed(() => this.store.modelById(this.editingId() ?? '') ?? null);
  protected readonly viewedLinks = computed(() => {
    const model = this.viewedModel();
    return model ? this.store.mappings().filter((mapping) => mapping.modelId === model.id) : [];
  });
  protected readonly confirmCount = computed(() => {
    const target = this.confirmTarget();
    if (!target) return 0;
    const key = target.kind === 'provider' ? 'providerId' : 'modelId';
    return new Set(this.store.mappings().filter((mapping) => mapping[key] === target.id).map((mapping) => mapping.productId)).size;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.providerId.set(params.get('providerId') ?? '');
      this.closeDialog();
      this.actionMenu.set(null);
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const section = query.get('section');
      this.section.set(section === 'models' || section === 'products' ? section : 'overview');
    });
    effect(() => this.pageContext.providerName.set(this.provider()?.name ?? ''));
    const syncMenu = () => this.syncActionMenu();
    document.addEventListener('scroll', syncMenu, true);
    window.addEventListener('resize', syncMenu);
    this.destroyRef.onDestroy(() => {
      this.pageContext.providerName.set('');
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

  protected setSection(section: SectionId): void {
    this.actionMenu.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: section === 'overview' ? null : section },
      queryParamsHandling: 'merge',
    });
  }

  protected goBack(): void {
    const params = { ...this.router.parseUrl(this.router.url).queryParams };
    const listTab = params['listTab'];
    delete params['listTab'];
    delete params['section'];
    if (listTab === 'models') params['tab'] = 'models';
    void this.router.navigate(['/providers-models'], { queryParams: params });
  }

  protected openProvider(): void {
    const provider = this.provider();
    if (!provider) return;
    this.providerForm.reset({
      name: provider.name,
      code: provider.code,
      kind: provider.kind,
      description: provider.description,
      endpoint: provider.endpoint,
    });
    this.formError.set('');
    this.dialog.set('provider');
  }

  protected saveProvider(): void {
    const provider = this.provider();
    this.providerForm.markAllAsTouched();
    if (!provider || this.providerForm.invalid) {
      this.formError.set('Provider명을 확인해 주세요.');
      return;
    }
    const value = this.providerForm.getRawValue();
    try {
      this.store.updateProvider(provider.id, { name: value.name, description: value.description, endpoint: value.endpoint });
      this.closeDialog();
      this.showToast('Provider를 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Provider를 저장하지 못했습니다.');
    }
  }

  protected openModel(model?: CatalogModel): void {
    this.actionMenu.set(null);
    const providerId = model?.providerId ?? this.providerId();
    this.modelForm.reset({
      providerId,
      name: model?.name ?? '',
      code: model?.code ?? '',
      description: model?.description ?? '',
      status: model?.status ?? 'inactive',
    });
    if (model) {
      this.modelForm.controls.code.disable();
      this.modelForm.controls.status.disable();
    } else {
      this.modelForm.controls.code.enable();
      this.modelForm.controls.status.enable();
    }
    this.modelProviderId.set(providerId);
    this.editingId.set(model?.id ?? null);
    this.formError.set('');
    this.dialog.set('model');
  }

  protected saveModel(): void {
    this.modelForm.markAllAsTouched();
    if (this.modelForm.invalid) {
      this.formError.set('Model명과 Model Code를 확인해 주세요.');
      return;
    }
    const value = this.modelForm.getRawValue();
    try {
      if (this.editingId()) this.store.updateModel(this.editingId()!, { name: value.name, description: value.description });
      else this.store.createModel({ ...value, providerId: this.providerId() });
      this.closeDialog();
      this.showToast('Model을 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Model을 저장하지 못했습니다.');
    }
  }

  protected openModelView(model: CatalogModel): void {
    this.actionMenu.set(null);
    this.editingId.set(model.id);
    this.dialog.set('view-model');
  }

  protected openModelViewById(id: string): void {
    const model = this.store.modelById(id);
    if (model) this.openModelView(model);
  }

  protected requestStatus(kind: 'provider' | 'model', id: string, active: boolean): void {
    this.actionMenu.set(null);
    if (active) {
      this.applyStatus(kind, id, 'active');
      return;
    }
    this.confirmTarget.set({ kind, id });
    this.dialog.set('confirm');
  }

  protected confirmStatus(): void {
    const target = this.confirmTarget();
    if (!target) return;
    this.applyStatus(target.kind, target.id, 'inactive');
    this.closeDialog();
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    this.formError.set('');
    this.confirmTarget.set(null);
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

  protected openModelFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button')) return;
    this.openModelViewById(id);
  }

  protected modelProductCount(modelId: string): number {
    return new Set(this.store.mappings().filter((mapping) => mapping.modelId === modelId).map((mapping) => mapping.productId)).size;
  }

  protected kindLabel(kind: ProviderKind): string {
    return kind === 'llm' ? 'LLM' : 'Non-LLM';
  }

  protected providerKindLabel(): string {
    const provider = this.provider();
    return provider ? this.kindLabel(provider.kind) : '';
  }

  protected modelTypeLabel(): string {
    const provider = this.store.providerById(this.modelProviderId()) ?? this.provider();
    return provider ? this.kindLabel(provider.kind) : '—';
  }

  protected statusLabel(status: string): string {
    if (status === 'active') return '활성';
    if (status === 'maintenance') return '점검';
    return '비활성';
  }

  protected statusTone(status: string): 'success' | 'neutral' | 'warning' {
    if (status === 'active') return 'success';
    if (status === 'maintenance') return 'warning';
    return 'neutral';
  }

  protected productQuery(kind: ProviderKind): Params {
    return kind === 'non-llm' ? { tab: 'configuration', ai: 'non-llm' } : { tab: 'configuration' };
  }

  private applyStatus(kind: 'provider' | 'model', id: string, status: CatalogStatus): void {
    if (kind === 'provider') this.store.setProviderStatus(id, status);
    else this.store.setModelStatus(id, status);
    this.showToast(status === 'active' ? '활성화했습니다.' : '비활성화했습니다.');
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
