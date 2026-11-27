import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Organization, OrganizationProduct, OrganizationStatus } from '../models/organization.models';
import { ProductsStore } from '../../products/data/products.store';
import { OrganizationsStore } from '../data/organizations.store';

type SortKey =
  | 'name'
  | 'code'
  | 'status'
  | 'users'
  | 'teams'
  | 'products'
  | 'contractEnd'
  | 'createdAt';

interface OrganizationRow {
  organization: Organization;
  users: number;
  teams: number;
  products: number;
}

@Component({
  selector: 'app-organization-list-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './organization-list.page.html',
  styleUrl: './organization-list.page.scss',
})
export class OrganizationListPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(OrganizationsStore);
  private readonly productsStore = inject(ProductsStore);

  protected readonly products = computed(() => this.productsStore.products().map((product) => product.name));
  protected readonly actionMenu = signal<string | null>(null);
  protected readonly actionMenuStyle = signal<{ top: string; left: string } | null>(null);
  protected readonly dialog = signal<'form' | 'confirm' | null>(null);
  protected readonly editing = signal<Organization | null>(null);
  protected readonly pendingAction = signal<'toggle' | 'delete' | null>(null);
  protected readonly toast = signal('');

  constructor() {
    const reposition = () => this.syncActionMenu();
    document.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    });
  }

  private readonly params = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({
        q: params.get('q') ?? '',
        status: (params.get('status') ?? 'all') as 'all' | OrganizationStatus,
        product: (params.get('product') ?? 'all') as 'all' | OrganizationProduct,
        sort: (params.get('sort') ?? 'name') as SortKey,
        direction: params.get('direction') === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, Number(params.get('page')) || 1),
        pageSize: 10,
      })),
    ),
    {
      initialValue: {
        q: '',
        status: 'all' as const,
        product: 'all' as const,
        sort: 'name' as SortKey,
        direction: 'asc',
        page: 1,
        pageSize: 10,
      },
    },
  );

  protected readonly summary = computed(() => {
    const organizations = this.store.organizations();
    return {
      total: organizations.length,
      active: organizations.filter((item) => item.status === 'active').length,
      inactive: organizations.filter((item) => item.status === 'inactive').length,
    };
  });

  private readonly rows = computed<OrganizationRow[]>(() =>
    this.store.organizations().map((organization) => ({
      organization,
      users: this.store.users().filter((item) => item.organizationId === organization.id).length,
      teams: this.store.teams().filter((item) => item.organizationId === organization.id).length,
      products: this.store
        .productAccesses()
        .filter((item) => item.organizationId === organization.id && item.status === 'active')
        .length,
    })),
  );

  protected readonly filteredRows = computed(() => {
    const query = this.params();
    const keyword = query.q.trim().toLowerCase();
    const rows = this.rows().filter(({ organization }) => {
      const searchMatch =
        !keyword ||
        organization.name.toLowerCase().includes(keyword) ||
        organization.code.toLowerCase().includes(keyword);
      const statusMatch = query.status === 'all' || organization.status === query.status;
      const productMatch =
        query.product === 'all' ||
        this.store
          .productAccesses()
          .some(
            (item) =>
              item.organizationId === organization.id &&
              item.status === 'active' &&
              item.product === query.product,
          );
      return searchMatch && statusMatch && productMatch;
    });

    return [...rows].sort((a, b) => {
      const values: Record<SortKey, [string | number, string | number]> = {
        name: [a.organization.name, b.organization.name],
        code: [a.organization.code, b.organization.code],
        status: [a.organization.status, b.organization.status],
        users: [a.users, b.users],
        teams: [a.teams, b.teams],
        products: [a.products, b.products],
        contractEnd: [
          a.organization.contractEndDate ?? '9999-12-31',
          b.organization.contractEndDate ?? '9999-12-31',
        ],
        createdAt: [a.organization.createdAt, b.organization.createdAt],
      };
      const [left, right] = values[query.sort];
      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right));
      return query.direction === 'asc' ? result : -result;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / this.params().pageSize)),
  );

  protected readonly page = computed(() => Math.min(this.params().page, this.totalPages()));

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.params().pageSize;
    return this.filteredRows().slice(start, start + this.params().pageSize);
  });

  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1).slice(
      Math.max(0, this.page() - 3),
      Math.max(0, this.page() - 3) + 5,
    ),
  );

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    code: new FormControl({ value: '자동 생성', disabled: true }, { nonNullable: true }),
    contactName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] }),
    contactPhone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    contractStartDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contractEndDate: new FormControl('', { nonNullable: true }),
    memo: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  protected query() {
    return this.params();
  }

  @HostListener('document:click', ['$event'])
  protected closeActionMenuOnOutsideClick(event: Event): void {
    if (!this.actionMenu()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.icon-action, .action-menu')) return;
    this.actionMenu.set(null);
    this.actionMenuStyle.set(null);
  }

  protected toggleActionMenu(organizationId: string, event: Event): void {
    event.stopPropagation();
    if (this.actionMenu() === organizationId) {
      this.actionMenu.set(null);
      this.actionMenuStyle.set(null);
      return;
    }
    this.actionMenu.set(organizationId);
    this.placeActionMenu(event.currentTarget as HTMLElement);
  }

  protected activeActionOrganization(): Organization | null {
    const id = this.actionMenu();
    return this.pagedRows().find((row) => row.organization.id === id)?.organization ?? null;
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

  private placeActionMenu(button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const menuWidth = 166;
    const menuHeight = 148;
    const gap = 6;
    const top =
      rect.bottom + gap + menuHeight > window.innerHeight && rect.top > menuHeight + gap
        ? rect.top - gap - menuHeight
        : rect.bottom + gap;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );
    this.actionMenuStyle.set({ top: `${top}px`, left: `${left}px` });
  }

  protected updateSearch(event: Event): void {
    this.updateParams({ q: (event.target as HTMLInputElement).value, page: 1 }, true);
  }

  protected updateSelect(key: 'status' | 'product', event: Event): void {
    this.updateParams({ [key]: (event.target as HTMLSelectElement).value, page: 1 });
  }

  protected sortBy(key: SortKey): void {
    const query = this.params();
    this.updateParams({
      sort: key,
      direction: query.sort === key && query.direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    });
  }

  protected goToPage(page: number): void {
    this.updateParams({ page: Math.min(Math.max(1, page), this.totalPages()) });
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      name: '',
      code: '자동 생성',
      contactName: '',
      contactPhone: '',
      contractStartDate: new Date().toISOString().slice(0, 10),
      contractEndDate: '',
      memo: '',
    });
    this.dialog.set('form');
  }

  protected openEdit(organization: Organization): void {
    this.actionMenu.set(null);
    this.editing.set(organization);
    this.form.reset({
      name: organization.name,
      code: organization.code,
      contactName: organization.contactName,
      contactPhone: organization.contactPhone,
      contractStartDate: organization.contractStartDate,
      contractEndDate: organization.contractEndDate ?? '',
      memo: organization.memo,
    });
    this.dialog.set('form');
  }

  protected saveOrganization(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (
      this.form.invalid ||
      (value.contractEndDate && value.contractEndDate < value.contractStartDate)
    ) {
      return;
    }
    if (this.editing()) {
      this.store.updateOrganization(this.editing()!.id, {
        name: value.name.trim(),
        contactName: value.contactName.trim(),
        contactPhone: value.contactPhone.trim(),
        contractStartDate: value.contractStartDate,
        contractEndDate: value.contractEndDate || null,
        memo: value.memo.trim(),
      });
      this.showToast('Organization이 수정되었습니다.');
    } else {
      this.store.createOrganization({
        name: value.name.trim(),
        contactName: value.contactName.trim(),
        contactPhone: value.contactPhone.trim(),
        contractStartDate: value.contractStartDate,
        contractEndDate: value.contractEndDate || null,
        memo: value.memo.trim(),
      });
      this.showToast('Organization이 추가되었습니다.');
    }
    this.dialog.set(null);
  }

  protected requestAction(organization: Organization, action: 'toggle' | 'delete'): void {
    this.editing.set(organization);
    this.pendingAction.set(action);
    this.actionMenu.set(null);
    this.dialog.set('confirm');
  }

  protected confirmAction(): void {
    const organization = this.editing();
    if (!organization) return;
    if (this.pendingAction() === 'delete') {
      this.store.deleteOrganization(organization.id);
      this.showToast('Organization이 삭제되었습니다.');
    } else if (organization.status === 'active') {
      this.store.deactivateOrganization(organization.id);
      this.showToast('Organization이 비활성화되었습니다.');
    } else {
      this.store.activateOrganization(organization.id);
      this.showToast('Organization이 활성화되었습니다.');
    }
    this.dialog.set(null);
  }

  protected isExpired(date: string | null): boolean {
    return !!date && date < new Date().toISOString().slice(0, 10);
  }

  protected detailParams(): Record<string, string | number> {
    return { ...this.params() };
  }

  protected openDetail(organization: Organization, event: Event): void {
    if ((event.target as HTMLElement).closest('a, button')) return;
    this.openOrganizationDetail(organization, event);
  }

  protected openOrganizationDetail(organization: Organization, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/organizations', organization.id], {
      queryParams: this.detailParams(),
    });
  }

  private updateParams(
    values: Record<string, string | number | null>,
    replaceUrl = false,
  ): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: values,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => this.toast.set(''), 2800);
  }
}
