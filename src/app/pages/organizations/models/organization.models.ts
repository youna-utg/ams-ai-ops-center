export const ORGANIZATION_PRODUCTS = [
  'ChangeUp',
  'TimeUp',
  'DeckUp',
  'DocUp',
  'MatchUp',
] as const;

export type OrganizationProduct = string;
export type OrganizationStatus = 'active' | 'inactive';
export type ProductAccessStatus = 'active' | 'ended';
export type OrganizationActivityType =
  | 'organization-created'
  | 'organization-updated'
  | 'organization-activated'
  | 'organization-deactivated'
  | 'organization-deleted'
  | 'team-created'
  | 'team-updated'
  | 'team-deleted'
  | 'product-access-added'
  | 'product-access-updated'
  | 'product-access-ended'
  | 'product-access-removed'
  | 'product-access-reused'
  | 'usage-recorded'
  | 'user-created'
  | 'user-updated'
  | 'user-activated'
  | 'user-deactivated'
  | 'user-deleted'
  | 'user-organization-changed'
  | 'user-team-changed';

export type ProductGlobalStatus = 'active' | 'inactive' | 'maintenance';
export type UserRegistrationType = 'manual' | 'bulk';

export const PRODUCT_CATALOG: Readonly<
  Record<OrganizationProduct, ProductGlobalStatus>
> = {
  ChangeUp: 'active',
  TimeUp: 'active',
  DeckUp: 'maintenance',
  DocUp: 'inactive',
  MatchUp: 'active',
};

export interface Organization {
  id: string;
  code: string;
  name: string;
  status: OrganizationStatus;
  industry: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  contractStartDate: string;
  contractEndDate: string | null;
  memo: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OrganizationTeam {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  memberIds: readonly string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OrganizationUser {
  id: string;
  organizationId: string;
  teamId: string | null;
  name: string;
  email: string;
  role: string;
  jobTitle: string;
  phone: string;
  registrationType: UserRegistrationType;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserUsageRecord {
  id: string;
  userId: string;
  organizationId: string;
  product: OrganizationProduct;
  provider: string;
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  providerCost: number;
  occurredAt: string;
}

export interface OrganizationProductAccess {
  id: string;
  organizationId: string;
  product: OrganizationProduct;
  status: ProductAccessStatus;
  seatLimit: number;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationProductUsage {
  id: string;
  organizationId: string;
  productAccessId: string;
  product: OrganizationProduct;
  period: string;
  activeUsers: number;
  usageCount: number;
  recordedAt: string;
  updatedAt: string;
}

export interface OrganizationActivity {
  id: string;
  organizationId: string;
  type: OrganizationActivityType;
  title: string;
  description: string;
  actorId: string | null;
  subjectUserId: string | null;
  field: string | null;
  previousValue: string | null;
  nextValue: string | null;
  actorLabel?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationDetail {
  organization: Organization;
  teams: readonly OrganizationTeam[];
  users: readonly OrganizationUser[];
  productAccesses: readonly OrganizationProductAccess[];
  productUsageHistory: readonly OrganizationProductUsage[];
  activities: readonly OrganizationActivity[];
}

export type CreateOrganizationInput = Pick<
  Organization,
  'name' | 'contractStartDate'
> &
  Partial<
    Pick<
      Organization,
      | 'industry'
      | 'description'
      | 'contactName'
      | 'contactEmail'
      | 'contactPhone'
      | 'address'
      | 'contractEndDate'
      | 'memo'
    >
  > & {
  status?: OrganizationStatus;
};

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export interface CreateUserInput {
  name: string;
  email: string;
  organizationId: string;
  teamId?: string | null;
  phone?: string;
  jobTitle?: string;
  registrationType?: UserRegistrationType;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface CreateTeamInput {
  name: string;
  description?: string;
  memberIds?: readonly string[];
}

export type UpdateTeamInput = Partial<CreateTeamInput>;

export interface AddProductAccessInput {
  product: OrganizationProduct;
  seatLimit: number;
  startsAt?: string;
  endsAt?: string | null;
}

export type UpdateProductAccessInput = Partial<
  Pick<OrganizationProductAccess, 'product' | 'seatLimit' | 'startsAt' | 'endsAt'>
>;

export interface ReuseProductAccessInput {
  seatLimit?: number;
  startsAt?: string;
  endsAt?: string | null;
}

export type RecordProductUsageInput = Pick<
  OrganizationProductUsage,
  'organizationId' | 'productAccessId' | 'period' | 'activeUsers' | 'usageCount'
>;

export type UpdateProductUsageInput = Partial<
  Pick<OrganizationProductUsage, 'period' | 'activeUsers' | 'usageCount'>
>;

export type AddOrganizationActivityInput = Pick<
  OrganizationActivity,
  'organizationId' | 'type' | 'title' | 'description'
> & {
  actorId?: string | null;
};

export type UpdateOrganizationActivityInput = Partial<
  Pick<OrganizationActivity, 'type' | 'title' | 'description' | 'actorId'>
>;

export interface OrganizationsData {
  organizations: readonly Organization[];
  teams: readonly OrganizationTeam[];
  users: readonly OrganizationUser[];
  productAccesses: readonly OrganizationProductAccess[];
  productUsageHistory: readonly OrganizationProductUsage[];
  activities: readonly OrganizationActivity[];
  userUsage: readonly UserUsageRecord[];
}
