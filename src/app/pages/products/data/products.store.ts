import { Injectable, computed, inject, signal } from '@angular/core';
import { OrganizationsStore } from '../../organizations/data/organizations.store';
import {
  ActionCode,
  CatalogActivity,
  CatalogModel,
  CatalogProduct,
  CatalogProvider,
  CatalogStatus,
  CreateProductInput,
  MappingInput,
  ModelInput,
  ModelUpdate,
  ProductActivity,
  ProductActivityType,
  ProductMapping,
  ProductStatus,
  ProductsData,
  ProviderInput,
  ProviderKind,
  ProviderUpdate,
  UpdateProductInput,
} from '../models/product.models';
import { PRODUCTS_MOCK_DATA } from './products.mock';

@Injectable({ providedIn: 'root' })
export class ProductsStore {
  private readonly organizations = inject(OrganizationsStore);
  private readonly state = signal<ProductsData>(this.clone(PRODUCTS_MOCK_DATA));

  readonly products = computed(() => this.state().products);
  readonly providers = computed(() => this.state().providers);
  readonly models = computed(() => this.state().models);
  readonly actionCodes = computed(() => this.state().actionCodes);
  readonly mappings = computed(() => this.state().mappings);
  readonly activityLog = computed(() => this.state().activities);
  readonly catalogLog = computed(() => this.state().catalogActivities);

  getById(id: string): CatalogProduct | undefined {
    return this.products().find((product) => product.id === id);
  }

  statusOf(name: string): ProductStatus {
    return this.products().find((product) => product.name === name)?.status ?? 'inactive';
  }

  providersFor(kind: ProviderKind): readonly CatalogProvider[] {
    return this.providers().filter((provider) => provider.kind === kind);
  }

  modelsFor(providerId: string, kind: ProviderKind): readonly CatalogModel[] {
    return this.models().filter((model) => model.providerId === providerId && model.kind === kind);
  }

  actionCodesFor(kind: ProviderKind): readonly ActionCode[] {
    return this.actionCodes().filter((code) => code.kind === kind);
  }

  mappingsFor(productId: string, kind: ProviderKind): readonly ProductMapping[] {
    const codeIds = new Set(this.actionCodesFor(kind).map((code) => code.id));
    return this.mappings()
      .filter((mapping) => mapping.productId === productId && codeIds.has(mapping.actionCodeId))
      .sort((a, b) => this.actionCode(a.actionCodeId).localeCompare(this.actionCode(b.actionCodeId)));
  }

  activitiesFor(productId: string): readonly ProductActivity[] {
    return this.state()
      .activities.filter((activity) => activity.productId === productId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  assignedOrganizations(productName: string): number {
    const ids = new Set(
      this.organizations
        .productAccesses()
        .filter((access) => access.product === productName && access.status === 'active')
        .map((access) => access.organizationId),
    );
    return ids.size;
  }

  activeUsers(productName: string): number {
    if (this.statusOf(productName) !== 'active') return 0;
    const organizationIds = new Set(
      this.organizations
        .productAccesses()
        .filter((access) => access.product === productName && access.status === 'active')
        .map((access) => access.organizationId),
    );
    const activeOrganizations = new Set(
      this.organizations
        .organizations()
        .filter((organization) => organization.status === 'active' && organizationIds.has(organization.id))
        .map((organization) => organization.id),
    );
    return this.organizations
      .users()
      .filter((user) => user.active && activeOrganizations.has(user.organizationId)).length;
  }

  activeMappingCount(productId: string): number {
    return this.mappings().filter((mapping) => mapping.productId === productId && mapping.status === 'active').length;
  }

  createProduct(input: CreateProductInput): CatalogProduct {
    const current = this.state();
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    this.assertNameAvailable(name, current);
    this.assertCodeAvailable(code, current);
    const now = new Date().toISOString();
    const product: CatalogProduct = {
      id: this.nextId('product', current.products.map((item) => item.id)),
      name,
      code,
      description: input.description?.trim() ?? '',
      status: input.status ?? 'inactive',
      createdAt: now,
      updatedAt: now,
    };
    this.state.set({
      ...current,
      products: [...current.products, product],
      activities: [
        ...current.activities,
        this.activity(current, product.id, 'product-created', 'Product', null, product.code, now),
      ],
    });
    return product;
  }

  updateProduct(id: string, input: UpdateProductInput): CatalogProduct {
    const current = this.state();
    const product = this.requireProduct(id, current);
    const name = input.name.trim();
    if (name.toLowerCase() !== product.name.toLowerCase()) this.assertNameAvailable(name, current);
    const now = new Date().toISOString();
    const updated: CatalogProduct = {
      ...product,
      name,
      description: input.description.trim(),
      updatedAt: now,
    };
    this.organizations.renameProduct(product.name, name);
    const descriptionChanged = product.description !== updated.description;
    this.state.set({
      ...current,
      products: current.products.map((item) => (item.id === id ? updated : item)),
      activities: [
        ...current.activities,
        this.activity(
          current,
          id,
          'product-updated',
          product.name === name ? 'Description' : 'Product',
          product.name === name ? product.description : product.name,
          product.name === name ? updated.description : `${name}${descriptionChanged ? ` · ${updated.description}` : ''}`,
          now,
        ),
      ],
    });
    return updated;
  }

  setStatus(id: string, status: ProductStatus): CatalogProduct {
    const current = this.state();
    const product = this.requireProduct(id, current);
    if (product.status === status) return product;
    const now = new Date().toISOString();
    const updated = { ...product, status, updatedAt: now };
    this.state.set({
      ...current,
      products: current.products.map((item) => (item.id === id ? updated : item)),
      activities: [
        ...current.activities,
        this.activity(current, id, 'product-status-changed', 'Status', this.statusLabel(product.status), this.statusLabel(status), now),
      ],
    });
    return updated;
  }

  addMapping(productId: string, kind: ProviderKind, input: MappingInput): ProductMapping {
    const current = this.state();
    this.requireProduct(productId, current);
    const action = this.resolveActionCode(input.actionCode, kind, current);
    this.assertMapping(productId, action.id, input, kind, current);
    const now = new Date().toISOString();
    const mapping: ProductMapping = {
      id: this.nextId('mapping', current.mappings.map((item) => item.id)),
      productId,
      actionCodeId: action.id,
      providerId: input.providerId,
      modelId: input.modelId,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    this.state.set({
      ...current,
      actionCodes: current.actionCodes.some((item) => item.id === action.id)
        ? current.actionCodes
        : [...current.actionCodes, action],
      mappings: [...current.mappings, mapping],
      activities: [
        ...current.activities,
        this.activity(current, productId, 'mapping-added', action.code, null, this.mappingLabel(mapping, current), now),
      ],
    });
    return mapping;
  }

  updateMapping(id: string, kind: ProviderKind, input: MappingInput): ProductMapping {
    const current = this.state();
    const mapping = this.requireMapping(id, current);
    const action = this.resolveActionCode(input.actionCode, kind, current);
    this.assertMapping(mapping.productId, action.id, input, kind, current, mapping.id);
    const now = new Date().toISOString();
    const updated: ProductMapping = {
      ...mapping,
      actionCodeId: action.id,
      providerId: input.providerId,
      modelId: input.modelId,
      status: input.status,
      updatedAt: now,
    };
    this.state.set({
      ...current,
      actionCodes: current.actionCodes.some((item) => item.id === action.id)
        ? current.actionCodes
        : [...current.actionCodes, action],
      mappings: current.mappings.map((item) => (item.id === id ? updated : item)),
      activities: [
        ...current.activities,
        this.activity(current, mapping.productId, 'mapping-updated', action.code, this.mappingLabel(mapping, current), this.mappingLabel(updated, current), now),
      ],
    });
    return updated;
  }

  setMappingStatus(id: string, active: boolean): ProductMapping {
    const current = this.state();
    const mapping = this.requireMapping(id, current);
    const status: 'active' | 'inactive' = active ? 'active' : 'inactive';
    if (mapping.status === status) return mapping;
    const now = new Date().toISOString();
    const updated = { ...mapping, status, updatedAt: now };
    this.state.set({
      ...current,
      mappings: current.mappings.map((item) => (item.id === id ? updated : item)),
      activities: [
        ...current.activities,
        this.activity(
          current,
          mapping.productId,
          active ? 'mapping-activated' : 'mapping-deactivated',
          this.actionCode(mapping.actionCodeId),
          this.statusLabel(mapping.status === 'active' ? 'active' : 'inactive'),
          this.statusLabel(status === 'active' ? 'active' : 'inactive'),
          now,
        ),
      ],
    });
    return updated;
  }

  removeMapping(id: string): void {
    const current = this.state();
    const mapping = this.requireMapping(id, current);
    const now = new Date().toISOString();
    this.state.set({
      ...current,
      mappings: current.mappings.filter((item) => item.id !== id),
      activities: [
        ...current.activities,
        this.activity(current, mapping.productId, 'mapping-removed', this.actionCode(mapping.actionCodeId), this.mappingLabel(mapping, current), null, now),
      ],
    });
  }

  providerById(id: string): CatalogProvider | undefined {
    return this.providers().find((provider) => provider.id === id);
  }

  modelById(id: string): CatalogModel | undefined {
    return this.models().find((model) => model.id === id);
  }

  providerName(id: string): string {
    return this.providerById(id)?.name ?? id;
  }

  modelName(id: string): string {
    return this.modelById(id)?.name ?? id;
  }

  createProvider(input: ProviderInput): CatalogProvider {
    const current = this.state();
    const provider = this.normalizeProvider(input, current);
    const now = new Date().toISOString();
    const created: CatalogProvider = {
      ...provider,
      id: this.nextId('provider', current.providers.map((item) => item.id)),
      createdAt: now,
      updatedAt: now,
    };
    this.state.set({
      ...current,
      providers: [...current.providers, created],
      catalogActivities: [...current.catalogActivities, this.catalogActivity(current, 'provider', created.id, 'created', [{ field: 'Name', before: null, after: created.name }], now)],
    });
    return created;
  }

  updateProvider(id: string, input: ProviderUpdate): CatalogProvider {
    const current = this.state();
    const existing = this.requireProvider(id, current);
    const name = input.name.trim();
    if (!name) throw new Error('Provider명을 입력해 주세요.');
    const now = new Date().toISOString();
    const updated: CatalogProvider = {
      ...existing,
      name,
      description: input.description.trim(),
      endpoint: input.endpoint.trim(),
      updatedAt: now,
    };
    const changes = this.fieldChanges([
      ['Name', existing.name, updated.name],
      ['Description', existing.description, updated.description],
      ['Endpoint', existing.endpoint, updated.endpoint],
    ]);
    this.state.set({
      ...current,
      providers: current.providers.map((item) => (item.id === id ? updated : item)),
      catalogActivities: changes.length
        ? [...current.catalogActivities, this.catalogActivity(current, 'provider', id, 'updated', changes, now)]
        : current.catalogActivities,
    });
    return updated;
  }

  setProviderStatus(id: string, status: CatalogStatus): CatalogProvider {
    const current = this.state();
    const existing = this.requireProvider(id, current);
    if (existing.status === status) return existing;
    const now = new Date().toISOString();
    const updated = { ...existing, status, updatedAt: now };
    this.state.set({
      ...current,
      providers: current.providers.map((item) => (item.id === id ? updated : item)),
      catalogActivities: [
        ...current.catalogActivities,
        this.catalogActivity(current, 'provider', id, 'status-changed', [{ field: 'Status', before: this.statusLabel(existing.status), after: this.statusLabel(status) }], now),
      ],
    });
    return updated;
  }

  createModel(input: ModelInput): CatalogModel {
    const current = this.state();
    const model = this.normalizeModel(input, current);
    const now = new Date().toISOString();
    const created: CatalogModel = {
      ...model,
      id: this.nextId('model', current.models.map((item) => item.id)),
      createdAt: now,
      updatedAt: now,
    };
    this.state.set({
      ...current,
      models: [...current.models, created],
      catalogActivities: [...current.catalogActivities, this.catalogActivity(current, 'model', created.id, 'created', [{ field: 'Name', before: null, after: created.name }], now)],
    });
    return created;
  }

  updateModel(id: string, input: ModelUpdate): CatalogModel {
    const current = this.state();
    const existing = this.requireModel(id, current);
    const name = input.name.trim();
    if (!name) throw new Error('Model명을 입력해 주세요.');
    const now = new Date().toISOString();
    const updated: CatalogModel = {
      ...existing,
      name,
      description: input.description.trim(),
      updatedAt: now,
    };
    const changes = this.fieldChanges([
      ['Name', existing.name, updated.name],
      ['Description', existing.description, updated.description],
    ]);
    this.state.set({
      ...current,
      models: current.models.map((item) => (item.id === id ? updated : item)),
      catalogActivities: changes.length
        ? [...current.catalogActivities, this.catalogActivity(current, 'model', id, 'updated', changes, now)]
        : current.catalogActivities,
    });
    return updated;
  }

  setModelStatus(id: string, status: CatalogStatus): CatalogModel {
    const current = this.state();
    const existing = this.requireModel(id, current);
    if (existing.status === status) return existing;
    const now = new Date().toISOString();
    const updated = { ...existing, status, updatedAt: now };
    this.state.set({
      ...current,
      models: current.models.map((item) => (item.id === id ? updated : item)),
      catalogActivities: [
        ...current.catalogActivities,
        this.catalogActivity(current, 'model', id, 'status-changed', [{ field: 'Status', before: this.statusLabel(existing.status), after: this.statusLabel(status) }], now),
      ],
    });
    return updated;
  }

  actionCode(id: string): string {
    return this.actionCodes().find((code) => code.id === id)?.code ?? id;
  }

  private assertMapping(
    productId: string,
    actionCodeId: string,
    input: MappingInput,
    kind: ProviderKind,
    data: ProductsData,
    ignoredId?: string,
  ): void {
    const provider = data.providers.find((item) => item.id === input.providerId && item.kind === kind);
    if (!provider) throw new Error('선택한 Provider를 이 탭에서 사용할 수 없습니다.');
    const model = data.models.find(
      (item) => item.id === input.modelId && item.providerId === provider.id && item.kind === kind,
    );
    if (!model) throw new Error('선택한 Model이 Provider에 없습니다.');
    const duplicate = data.mappings.some(
      (mapping) =>
        mapping.id !== ignoredId &&
        mapping.productId === productId &&
        mapping.actionCodeId === actionCodeId &&
        mapping.providerId === input.providerId &&
        mapping.modelId === input.modelId,
    );
    if (duplicate) throw new Error('같은 Action Code, Provider, Model 조합이 이미 있습니다.');
  }

  private resolveActionCode(code: string, kind: ProviderKind, data: ProductsData): ActionCode {
    const normalized = code.trim().toUpperCase();
    if (!normalized) throw new Error('Action Code는 필수입니다.');
    const existing = data.actionCodes.find((item) => item.code.toLowerCase() === normalized.toLowerCase());
    if (existing && existing.kind !== kind) throw new Error('이 Action Code는 다른 Provider 유형에 속합니다.');
    return existing ?? { id: this.nextId('action', data.actionCodes.map((item) => item.id)), code: normalized, kind };
  }

  private assertNameAvailable(name: string, data: ProductsData): void {
    if (data.products.some((product) => product.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('같은 이름의 Product가 있습니다.');
    }
  }

  private assertCodeAvailable(code: string, data: ProductsData): void {
    if (data.products.some((product) => product.code.toLowerCase() === code.toLowerCase())) {
      throw new Error('같은 Product Code가 있습니다.');
    }
  }

  private requireProduct(id: string, data: ProductsData): CatalogProduct {
    const product = data.products.find((item) => item.id === id);
    if (!product) throw new Error('제품을 찾을 수 없습니다.');
    return product;
  }

  private normalizeProvider(input: ProviderInput, data: ProductsData): ProviderInput {
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    if (!name) throw new Error('Provider명을 입력해 주세요.');
    if (!code) throw new Error('Provider Code를 입력해 주세요.');
    if (input.kind !== 'llm' && input.kind !== 'non-llm') throw new Error('Provider Type을 선택해 주세요.');
    this.assertCatalogCode(data.providers, code);
    return { ...input, name, code, description: input.description.trim(), endpoint: input.endpoint.trim() };
  }

  private normalizeModel(input: ModelInput, data: ProductsData): Omit<CatalogModel, 'id' | 'createdAt' | 'updatedAt'> {
    const provider = data.providers.find((item) => item.id === input.providerId);
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    if (!provider) throw new Error('Provider를 선택해 주세요.');
    if (!name) throw new Error('Model명을 입력해 주세요.');
    if (!code) throw new Error('Model Code를 입력해 주세요.');
    this.assertCatalogCode(data.models, code);
    return {
      providerId: provider.id,
      name,
      code,
      kind: provider.kind,
      description: input.description.trim(),
      status: input.status,
    };
  }

  private assertCatalogCode(records: readonly { code: string }[], code: string): void {
    if (records.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
      throw new Error('같은 Code가 있습니다.');
    }
  }

  private requireProvider(id: string, data: ProductsData): CatalogProvider {
    const provider = data.providers.find((item) => item.id === id);
    if (!provider) throw new Error('Provider를 찾을 수 없습니다.');
    return provider;
  }

  private requireModel(id: string, data: ProductsData): CatalogModel {
    const model = data.models.find((item) => item.id === id);
    if (!model) throw new Error('Model을 찾을 수 없습니다.');
    return model;
  }

  private requireMapping(id: string, data: ProductsData): ProductMapping {
    const mapping = data.mappings.find((item) => item.id === id);
    if (!mapping) throw new Error('Mapping을 찾을 수 없습니다.');
    return mapping;
  }

  private mappingLabel(mapping: ProductMapping, data: ProductsData): string {
    const provider = data.providers.find((item) => item.id === mapping.providerId)?.name ?? mapping.providerId;
    const model = data.models.find((item) => item.id === mapping.modelId)?.name ?? mapping.modelId;
    return `${provider} / ${model}`;
  }

  private activity(
    data: ProductsData,
    productId: string,
    type: ProductActivityType,
    target: string,
    previousValue: string | null,
    nextValue: string | null,
    timestamp: string,
  ): ProductActivity {
    return {
      id: this.nextId('product-activity', data.activities.map((item) => item.id)),
      productId,
      type,
      target,
      previousValue,
      nextValue,
      actorLabel: 'Demo Administrator',
      createdAt: timestamp,
    };
  }

  private catalogActivity(
    data: ProductsData,
    targetType: CatalogActivity['targetType'],
    targetId: string,
    action: CatalogActivity['action'],
    changes: CatalogActivity['changes'],
    timestamp: string,
  ): CatalogActivity {
    return {
      id: this.nextId('catalog-activity', data.catalogActivities.map((item) => item.id)),
      targetType,
      targetId,
      action,
      changes,
      actorLabel: 'Demo Administrator',
      createdAt: timestamp,
    };
  }

  private fieldChanges(pairs: readonly (readonly [string, string, string])[]): CatalogActivity['changes'] {
    return pairs.filter(([, before, after]) => before !== after).map(([field, before, after]) => ({ field, before, after }));
  }

  private statusLabel(status: string): string {
    if (status === 'active') return '활성';
    if (status === 'maintenance') return '점검';
    return '비활성';
  }

  private nextId(prefix: string, ids: readonly string[]): string {
    const maximum = ids.reduce((result, id) => {
      const digits = id.match(/\d+/g);
      return Math.max(result, digits ? Number(digits.join('')) : 0);
    }, 0);
    return `${prefix}-${String(maximum + 1).padStart(4, '0')}`;
  }

  private clone(data: ProductsData): ProductsData {
    return {
      products: data.products.map((item) => ({ ...item })),
      providers: data.providers.map((item) => ({ ...item })),
      models: data.models.map((item) => ({ ...item })),
      actionCodes: data.actionCodes.map((item) => ({ ...item })),
      mappings: data.mappings.map((item) => ({ ...item })),
      activities: data.activities.map((item) => ({ ...item })),
      catalogActivities: data.catalogActivities.map((item) => ({ ...item, changes: item.changes.map((change) => ({ ...change })) })),
    };
  }
}
