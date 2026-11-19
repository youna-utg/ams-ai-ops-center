import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageContextService } from '../../../core/services/page-context.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { OrganizationsStore } from '../../organizations/data/organizations.store';
import { ProductsStore } from '../data/products.store';
import { MappingStatus, ProductActivityType, ProductMapping, ProductStatus, ProviderKind } from '../models/product.models';

type DetailTab = 'overview' | 'configuration' | 'organizations' | 'activity';

@Component({
  selector: 'app-product-detail-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './product-detail.page.html',
  styleUrl: './product-detail.page.scss',
})
export class ProductDetailPage {
  protected readonly store = inject(ProductsStore);
  private readonly organizations = inject(OrganizationsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly pageContext = inject(PageContextService);

  protected readonly tabs: ReadonlyArray<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'configuration', label: 'AI Configuration' },
    { id: 'organizations', label: 'Organizations' },
    { id: 'activity', label: 'Activity' },
  ];
  protected readonly productId = signal('');
  protected readonly tab = signal<DetailTab>('overview');
  protected readonly kind = signal<ProviderKind>('llm');
  protected readonly mapQuery = signal('');
  protected readonly mapProvider = signal('all');
  protected readonly mapModel = signal('all');
  protected readonly mapStatus = signal('all');
  protected readonly historyAction = signal('all');
  protected readonly historyFrom = signal('');
  protected readonly historyTo = signal('');
  protected readonly dialog = signal<'edit' | 'status' | 'mapping' | 'remove' | null>(null);
  protected readonly editingMappingId = signal<string | null>(null);
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  private toastTimer = 0;

  protected readonly productForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', Validators.maxLength(300)],
  });
  protected readonly statusControl = this.formBuilder.nonNullable.control<ProductStatus>('inactive');
  protected readonly mappingForm = this.formBuilder.nonNullable.group({
    actionCode: ['', Validators.required],
    providerId: ['', Validators.required],
    modelId: ['', Validators.required],
    status: ['active' as MappingStatus, Validators.required],
  });

  protected readonly product = computed(() => this.store.getById(this.productId()));
  protected readonly llmCount = computed(() => this.product() ? this.store.mappingsFor(this.product()!.id, 'llm').filter((item) => item.status === 'active').length : 0);
  protected readonly nonLlmCount = computed(() => this.product() ? this.store.mappingsFor(this.product()!.id, 'non-llm').filter((item) => item.status === 'active').length : 0);
  protected readonly assigned = computed(() => this.product() ? this.store.assignedOrganizations(this.product()!.name) : 0);
  protected readonly activeUsers = computed(() => this.product() ? this.store.activeUsers(this.product()!.name) : 0);
  protected readonly activeMappings = computed(() => this.product() ? this.store.activeMappingCount(this.product()!.id) : 0);
  protected readonly selectedProviderId = signal('');
  protected readonly providerOptions = computed(() => this.store.providersFor(this.kind()));
  protected readonly modelOptions = computed(() => this.store.modelsFor(this.selectedProviderId(), this.kind()));
  protected readonly filterModels = computed(() =>
    this.store.models().filter((model) => model.kind === this.kind() && (this.mapProvider() === 'all' || model.providerId === this.mapProvider())),
  );
  protected readonly actionOptions = computed(() => this.store.actionCodesFor(this.kind()));
  protected readonly mappingRows = computed(() => {
    const product = this.product();
    if (!product) return [];
    const query = this.mapQuery().trim().toLowerCase();
    return this.store.mappingsFor(product.id, this.kind()).filter((mapping) => {
      const code = this.store.actionCode(mapping.actionCodeId).toLowerCase();
      const matchesQuery = !query || code.includes(query);
      const matchesProvider = this.mapProvider() === 'all' || mapping.providerId === this.mapProvider();
      const matchesModel = this.mapModel() === 'all' || mapping.modelId === this.mapModel();
      const matchesStatus = this.mapStatus() === 'all' || mapping.status === this.mapStatus();
      return matchesQuery && matchesProvider && matchesModel && matchesStatus;
    });
  });
  protected readonly organizationRows = computed(() => {
    const product = this.product();
    if (!product) return [];
    return this.organizations.productAccesses()
      .filter((access) => access.product === product.name)
      .map((access) => ({
        access,
        organization: this.organizations.organizations().find((item) => item.id === access.organizationId),
      }))
      .filter((row) => row.organization);
  });
  protected readonly organizationSummary = computed(() => ({
    assigned: this.organizationRows().filter((row) => row.access.status === 'active').length,
    active: this.organizationRows().filter((row) => row.access.status === 'active' && row.organization?.status === 'active').length,
    inactive: this.organizationRows().filter((row) => row.access.status === 'active' && row.organization?.status === 'inactive').length,
  }));
  protected readonly history = computed(() => {
    const product = this.product();
    if (!product) return [];
    return this.store.activitiesFor(product.id).filter((activity) => {
      const day = activity.createdAt.slice(0, 10);
      const matchesAction = this.historyAction() === 'all' || activity.type === this.historyAction();
      return matchesAction && (!this.historyFrom() || day >= this.historyFrom()) && (!this.historyTo() || day <= this.historyTo());
    });
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => this.productId.set(params.get('productId') ?? ''));
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const tab = query.get('tab');
      this.tab.set(tab === 'configuration' || tab === 'organizations' || tab === 'activity' ? tab : 'overview');
      this.kind.set(query.get('ai') === 'non-llm' ? 'non-llm' : 'llm');
      this.mapQuery.set(query.get('mapQ') ?? '');
      this.mapProvider.set(query.get('mapProvider') ?? 'all');
      this.mapModel.set(query.get('mapModel') ?? 'all');
      this.mapStatus.set(query.get('mapStatus') ?? 'all');
      this.historyAction.set(query.get('historyAction') ?? 'all');
      this.historyFrom.set(query.get('historyFrom') ?? '');
      this.historyTo.set(query.get('historyTo') ?? '');
    });
    effect(() => this.pageContext.productName.set(this.product()?.name ?? ''));
  }

  protected setTab(tab: DetailTab): void {
    this.updateQuery({ tab: tab === 'overview' ? null : tab });
  }

  protected setKind(kind: ProviderKind): void {
    this.updateQuery({ ai: kind === 'llm' ? null : kind, mapProvider: null, mapModel: null });
  }

  protected updateMap(key: 'mapQ' | 'mapProvider' | 'mapModel' | 'mapStatus', value: string): void {
    this.updateQuery({ [key]: !value || value === 'all' ? null : value });
  }

  protected changeMapProvider(value: string): void {
    this.updateQuery({ mapProvider: !value || value === 'all' ? null : value, mapModel: null });
  }

  protected updateHistory(key: 'historyAction' | 'historyFrom' | 'historyTo', value: string): void {
    this.updateQuery({ [key]: value || null });
  }

  protected goBack(): void {
    const queryParams: Record<string, string> = {};
    this.route.snapshot.queryParamMap.keys.forEach((key) => {
      if (['tab', 'ai', 'mapQ', 'mapProvider', 'mapModel', 'mapStatus', 'historyAction', 'historyFrom', 'historyTo'].includes(key)) return;
      const value = this.route.snapshot.queryParamMap.get(key);
      if (value !== null) queryParams[key] = value;
    });
    void this.router.navigate(['/products'], { queryParams });
  }

  protected statusLabel(status: string): string {
    if (status === 'active') return '활성';
    if (status === 'maintenance') return '점검';
    return '비활성';
  }

  protected statusTone(status: string): 'success' | 'warning' | 'neutral' {
    if (status === 'active') return 'success';
    if (status === 'maintenance') return 'warning';
    return 'neutral';
  }

  protected actionLabel(type: ProductActivityType): string {
    const labels: Record<ProductActivityType, string> = {
      'product-created': '제품 등록',
      'product-updated': '제품 수정',
      'product-status-changed': '상태 변경',
      'mapping-added': 'Mapping 추가',
      'mapping-updated': 'Mapping 수정',
      'mapping-activated': 'Mapping 활성화',
      'mapping-deactivated': 'Mapping 비활성화',
      'mapping-removed': 'Mapping 제거',
    };
    return labels[type];
  }

  protected display(value: string | null): string {
    return value || '—';
  }

  protected openEdit(): void {
    const product = this.product();
    if (!product) return;
    this.productForm.reset({ name: product.name, description: product.description });
    this.formError.set('');
    this.dialog.set('edit');
  }

  protected saveProduct(): void {
    const product = this.product();
    this.productForm.markAllAsTouched();
    if (!product || this.productForm.invalid) {
      this.formError.set('제품명을 확인해 주세요.');
      return;
    }
    const value = this.productForm.getRawValue();
    try {
      this.store.updateProduct(product.id, value);
      this.closeDialog();
      this.showToast('제품을 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : '제품을 저장하지 못했습니다.');
    }
  }

  protected openStatus(): void {
    const product = this.product();
    if (!product) return;
    this.statusControl.setValue(product.status);
    this.formError.set('');
    this.dialog.set('status');
  }

  protected saveStatus(): void {
    const product = this.product();
    const next = this.statusControl.value;
    if (!product || product.status === next) {
      this.closeDialog();
      return;
    }
    if (product.status === 'active' && this.formError() !== 'confirmed') {
      this.formError.set('confirmed');
      return;
    }
    this.store.setStatus(product.id, next);
    this.closeDialog();
    this.showToast('제품 상태를 변경했습니다.');
  }

  protected openMapping(mapping?: ProductMapping): void {
    this.editingMappingId.set(mapping?.id ?? null);
    this.mappingForm.reset({
      actionCode: mapping ? this.store.actionCode(mapping.actionCodeId) : '',
      providerId: mapping?.providerId ?? '',
      modelId: '',
      status: mapping?.status ?? 'active',
    });
    this.selectedProviderId.set(mapping?.providerId ?? '');
    if (mapping) this.mappingForm.controls.modelId.setValue(mapping.modelId);
    this.formError.set('');
    this.dialog.set('mapping');
  }

  protected changeProvider(event: Event): void {
    const providerId = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.selectedProviderId.set(providerId);
    this.mappingForm.controls.providerId.setValue(providerId);
    this.mappingForm.controls.modelId.setValue('');
  }

  protected saveMapping(): void {
    const product = this.product();
    this.mappingForm.markAllAsTouched();
    if (!product || this.mappingForm.invalid) {
      this.formError.set('Action Code, Provider, Model을 확인해 주세요.');
      return;
    }
    const value = this.mappingForm.getRawValue();
    try {
      if (this.editingMappingId()) this.store.updateMapping(this.editingMappingId()!, this.kind(), value);
      else this.store.addMapping(product.id, this.kind(), value);
      this.closeDialog();
      this.showToast('Mapping을 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Mapping을 저장하지 못했습니다.');
    }
  }

  protected toggleMapping(mapping: ProductMapping): void {
    this.store.setMappingStatus(mapping.id, mapping.status !== 'active');
    this.showToast(mapping.status === 'active' ? 'Mapping을 비활성화했습니다.' : 'Mapping을 활성화했습니다.');
  }

  protected requestRemove(mapping: ProductMapping): void {
    this.editingMappingId.set(mapping.id);
    this.dialog.set('remove');
  }

  protected removeMapping(): void {
    const id = this.editingMappingId();
    if (!id) return;
    this.store.removeMapping(id);
    this.closeDialog();
    this.showToast('Mapping을 제거했습니다.');
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    this.formError.set('');
  }

  private updateQuery(values: Record<string, string | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: values, queryParamsHandling: 'merge' });
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 2400);
  }
}
