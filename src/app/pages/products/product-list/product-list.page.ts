import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ProductsStore } from '../data/products.store';
import { CatalogProduct, ProductStatus } from '../models/product.models';

type ProductSort = 'name' | 'code' | 'status' | 'organizations' | 'users' | 'created';

interface ListParams {
  q: string;
  status: 'all' | ProductStatus;
  sort: ProductSort;
  direction: 'asc' | 'desc';
  page: number;
}

@Component({
  selector: 'app-product-list-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './product-list.page.html',
  styleUrl: './product-list.page.scss',
})
export class ProductListPage {
  private readonly store = inject(ProductsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly params = signal<ListParams>({
    q: '',
    status: 'all',
    sort: 'name',
    direction: 'asc',
    page: 1,
  });
  protected readonly dialog = signal<'create' | 'edit' | 'status' | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  protected readonly actionMenu = signal<string | null>(null);
  protected readonly actionMenuStyle = signal<{ top: string; left: string } | null>(null);
  private toastTimer = 0;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', Validators.maxLength(300)],
    status: ['inactive' as ProductStatus, Validators.required],
  });
  protected readonly statusControl = this.formBuilder.nonNullable.control<ProductStatus>('inactive');

  protected readonly summary = computed(() => {
    const products = this.store.products();
    return {
      total: products.length,
      active: products.filter((product) => product.status === 'active').length,
      inactive: products.filter((product) => product.status === 'inactive').length,
      maintenance: products.filter((product) => product.status === 'maintenance').length,
    };
  });
  protected readonly filteredRows = computed(() => {
    const params = this.params();
    const query = params.q.trim().toLowerCase();
    const rows = this.store.products().filter((product) => {
      const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.code.toLowerCase().includes(query);
      const matchesStatus = params.status === 'all' || product.status === params.status;
      return matchesQuery && matchesStatus;
    });
    const direction = params.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => this.compare(a, b, params.sort) * direction);
  });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRows().length / 10)));
  protected readonly pagedRows = computed(() => {
    const page = Math.min(this.params().page, this.totalPages());
    return this.filteredRows().slice((page - 1) * 10, page * 10);
  });
  protected readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, index) => index + 1));
  protected readonly activeActionProduct = computed(() => this.pagedRows().find((product) => product.id === this.actionMenu()) ?? null);
  protected readonly editingProduct = computed(() => this.store.getById(this.editingId() ?? ''));
  protected readonly hasFilters = computed(() => Boolean(this.params().q || this.params().status !== 'all'));

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const status = query.get('status');
      const sort = query.get('sort');
      this.params.set({
        q: query.get('q') ?? '',
        status: status === 'active' || status === 'inactive' || status === 'maintenance' ? status : 'all',
        sort: this.isSort(sort) ? sort : 'name',
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

  protected assigned(product: CatalogProduct): number {
    return this.store.assignedOrganizations(product.name);
  }

  protected activeUsers(product: CatalogProduct): number {
    return this.store.activeUsers(product.name);
  }

  protected statusLabel(status: ProductStatus): string {
    if (status === 'active') return '활성';
    if (status === 'maintenance') return '점검';
    return '비활성';
  }

  protected statusTone(status: ProductStatus): 'success' | 'warning' | 'neutral' {
    if (status === 'active') return 'success';
    if (status === 'maintenance') return 'warning';
    return 'neutral';
  }

  protected listQuery(): Record<string, string> {
    return this.queryFrom(this.params());
  }

  protected updateQuery(value: string): void {
    this.navigate({ ...this.params(), q: value, page: 1 });
  }

  protected updateStatus(value: string): void {
    const status = value === 'active' || value === 'inactive' || value === 'maintenance' ? value : 'all';
    this.navigate({ ...this.params(), status, page: 1 });
  }

  protected clearFilters(): void {
    this.navigate({ ...this.params(), q: '', status: 'all', page: 1 });
  }

  protected sortBy(sort: ProductSort): void {
    const current = this.params();
    this.navigate({
      ...current,
      sort,
      direction: current.sort === sort && current.direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    });
  }

  protected changePage(page: number): void {
    this.navigate({ ...this.params(), page });
  }

  protected openCreate(): void {
    this.form.reset({ name: '', code: '', description: '', status: 'inactive' });
    this.form.controls.code.enable();
    this.editingId.set(null);
    this.formError.set('');
    this.dialog.set('create');
  }

  protected openEdit(product: CatalogProduct): void {
    this.actionMenu.set(null);
    this.form.reset({ name: product.name, code: product.code, description: product.description, status: product.status });
    this.form.controls.code.disable();
    this.editingId.set(product.id);
    this.formError.set('');
    this.dialog.set('edit');
  }

  protected openStatus(product: CatalogProduct): void {
    this.actionMenu.set(null);
    this.editingId.set(product.id);
    this.statusControl.setValue(product.status);
    this.formError.set('');
    this.dialog.set('status');
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    this.formError.set('');
  }

  protected saveProduct(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.formError.set('제품명과 Product Code를 확인해 주세요.');
      return;
    }
    const value = this.form.getRawValue();
    try {
      if (this.dialog() === 'create') {
        this.store.createProduct(value);
      } else {
        this.store.updateProduct(this.editingId() ?? '', { name: value.name, description: value.description });
      }
      this.closeDialog();
      this.showToast('제품을 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : '제품을 저장하지 못했습니다.');
    }
  }

  protected saveStatus(): void {
    const product = this.editingProduct();
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

  protected openDetail(product: CatalogProduct, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button')) return;
    this.openProductDetail(product, event);
  }

  protected openProductDetail(product: CatalogProduct, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/products', product.id], { queryParams: this.listQuery() });
  }

  private compare(a: CatalogProduct, b: CatalogProduct, sort: ProductSort): number {
    const value = (product: CatalogProduct) => {
      switch (sort) {
        case 'code':
          return product.code;
        case 'status':
          return product.status;
        case 'organizations':
          return String(this.assigned(product)).padStart(6, '0');
        case 'users':
          return String(this.activeUsers(product)).padStart(6, '0');
        case 'created':
          return product.createdAt;
        default:
          return product.name;
      }
    };
    return value(a).localeCompare(value(b), 'ko');
  }

  private navigate(params: ListParams): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: this.queryFrom(params) });
  }

  private queryFrom(params: ListParams): Record<string, string> {
    const query: Record<string, string> = {};
    if (params.q) query['q'] = params.q;
    if (params.status !== 'all') query['status'] = params.status;
    if (params.sort !== 'name') query['sort'] = params.sort;
    if (params.direction !== 'asc') query['direction'] = params.direction;
    if (params.page > 1) query['page'] = String(params.page);
    return query;
  }

  private isSort(value: string | null): value is ProductSort {
    return value === 'name' || value === 'code' || value === 'status' || value === 'organizations' || value === 'users' || value === 'created';
  }

  private placeActionMenu(button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const menuWidth = 166;
    const menuHeight = 116;
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
