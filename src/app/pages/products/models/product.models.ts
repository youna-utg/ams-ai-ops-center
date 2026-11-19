export type ProductStatus = 'active' | 'inactive' | 'maintenance';
export type ProviderKind = 'llm' | 'non-llm';
export type MappingStatus = 'active' | 'inactive';
export type CatalogStatus = 'active' | 'inactive';

export type ProductActivityType =
  | 'product-created'
  | 'product-updated'
  | 'product-status-changed'
  | 'mapping-added'
  | 'mapping-updated'
  | 'mapping-activated'
  | 'mapping-deactivated'
  | 'mapping-removed';

export interface CatalogProduct {
  id: string;
  name: string;
  code: string;
  description: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProvider {
  id: string;
  name: string;
  code: string;
  kind: ProviderKind;
  description: string;
  endpoint: string;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogModel {
  id: string;
  providerId: string;
  name: string;
  code: string;
  kind: ProviderKind;
  description: string;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderInput {
  name: string;
  code: string;
  kind: ProviderKind;
  description: string;
  endpoint: string;
  status: CatalogStatus;
}

export interface ProviderUpdate {
  name: string;
  description: string;
  endpoint: string;
}

export interface ModelInput {
  providerId: string;
  name: string;
  code: string;
  description: string;
  status: CatalogStatus;
}

export interface ModelUpdate {
  name: string;
  description: string;
}

export interface ActionCode {
  id: string;
  code: string;
  kind: ProviderKind;
}

export interface ProductMapping {
  id: string;
  productId: string;
  actionCodeId: string;
  providerId: string;
  modelId: string;
  status: MappingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductActivity {
  id: string;
  productId: string;
  type: ProductActivityType;
  target: string;
  previousValue: string | null;
  nextValue: string | null;
  createdAt: string;
}

export interface ProductsData {
  products: readonly CatalogProduct[];
  providers: readonly CatalogProvider[];
  models: readonly CatalogModel[];
  actionCodes: readonly ActionCode[];
  mappings: readonly ProductMapping[];
  activities: readonly ProductActivity[];
}

export interface CreateProductInput {
  name: string;
  code: string;
  description?: string;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  name: string;
  description: string;
}

export interface MappingInput {
  actionCode: string;
  providerId: string;
  modelId: string;
  status: MappingStatus;
}
