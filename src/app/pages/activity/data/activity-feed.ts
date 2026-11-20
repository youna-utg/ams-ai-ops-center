import { Injectable, computed, inject, signal } from '@angular/core';
import { AdminActivity, AdminActivityAction } from '../../admin/models/admin.models';
import { AdminStore } from '../../admin/data/admin.store';
import { OrganizationActivity, OrganizationActivityType } from '../../organizations/models/organization.models';
import { OrganizationsStore } from '../../organizations/data/organizations.store';
import { PlansStore } from '../../plans/data/plans.store';
import { PlanActivity } from '../../plans/models/plans.models';
import { CatalogActivity, ProductActivity, ProductActivityType } from '../../products/models/product.models';
import { ProductsStore } from '../../products/data/products.store';
import { MonitoringStore } from '../../monitoring/data/monitoring.store';
import { MonitoringActivity, MonitoringActivityAction } from '../../monitoring/models/monitoring.models';
import { SettingsStore } from '../../settings/data/settings.store';
import { SettingsAction } from '../../settings/models/settings.models';
import { UsageStore } from '../../usage/data/usage.store';
import { RateCardHistory } from '../../usage/models/usage.models';
import { ActivityCategory, ActivityChange, ActivityLink, ActivityModule, ActivityView } from '../models/activity.models';

const MODULE_LABEL: Record<ActivityModule, string> = {
  organizations: 'Organizations',
  users: 'Users',
  products: 'Products',
  'plans-points': 'Plans & Points',
  'providers-models': 'Providers & Models',
  'usage-costs': 'Usage & Costs',
  'admin-permissions': 'Admin & Permissions',
  'system-monitoring': 'System Monitoring',
  settings: 'Settings',
};

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  created: '등록',
  updated: '수정',
  'status-changed': '상태 변경',
  added: '추가',
  removed: '제거',
  activated: '활성화',
  deactivated: '비활성화',
  'permission-changed': '권한 변경',
};

const USER_TYPES = new Set<OrganizationActivityType>([
  'user-created',
  'user-updated',
  'user-activated',
  'user-deactivated',
  'user-deleted',
  'user-organization-changed',
  'user-team-changed',
]);

@Injectable({ providedIn: 'root' })
export class ActivityFeed {
  private readonly organizations = inject(OrganizationsStore);
  private readonly products = inject(ProductsStore);
  private readonly plans = inject(PlansStore);
  private readonly usage = inject(UsageStore);
  private readonly admins = inject(AdminStore);
  private readonly monitoring = inject(MonitoringStore);
  private readonly settings = inject(SettingsStore);
  private readonly refreshTick = signal(0);

  readonly events = computed(() => {
    this.refreshTick();
    return [
      ...this.organizationEvents(),
      ...this.productEvents(),
      ...this.catalogEvents(),
      ...this.planEvents(),
      ...this.rateEvents(),
      ...this.adminEvents(),
      ...this.incidentEvents(),
      ...this.settingsEvents(),
      this.missingSample(),
    ];
  });

  refresh(): void {
    this.refreshTick.update((value) => value + 1);
  }

  private organizationEvents(): ActivityView[] {
    const organizations = this.organizations.organizationRecords();
    const users = this.organizations.userRecords();
    return this.organizations.activityLog().flatMap((activity) => {
      const category = organizationCategory(activity.type);
      if (!category) return [];
      const userEvent = USER_TYPES.has(activity.type);
      const user = users.find((item) => item.id === activity.subjectUserId);
      const organization = organizations.find((item) => item.id === activity.organizationId);
      const actor = organizationActor(activity, users);
      const targetId = userEvent && activity.subjectUserId ? activity.subjectUserId : activity.organizationId;
      const available = userEvent
        ? !!user && !user.deletedAt && !!organization && !organization.deletedAt
        : !!organization && !organization.deletedAt;
      const targetLabel = userEvent
        ? user?.name ?? activity.nextValue ?? activity.subjectUserId ?? 'Unknown Actor'
        : organization?.name ?? activity.organizationId;
      return [this.view({
        id: activity.id,
        timestamp: activity.createdAt,
        module: userEvent ? 'users' : 'organizations',
        category,
        sourceAction: activity.type,
        actorLabel: actor.label,
        actorDetail: actor.detail,
        targetTypeLabel: userEvent ? 'User' : activity.type.startsWith('team-') ? 'Team' : activity.type.startsWith('product-access') ? 'Product Access' : 'Organization',
        targetId,
        targetLabel,
        targetCode: userEvent ? user?.email ?? null : organization?.code ?? null,
        summary: activity.description || activity.title,
        changes: fieldChange(activity.field, activity.previousValue, activity.nextValue),
        available,
        link: available
          ? userEvent
            ? { commands: ['/users', targetId] }
            : { commands: ['/organizations', activity.organizationId] }
          : null,
      })];
    });
  }

  private productEvents(): ActivityView[] {
    return this.products.activityLog().map((activity) => {
      const product = this.products.getById(activity.productId);
      return this.view({
        id: activity.id,
        timestamp: activity.createdAt,
        module: 'products',
        category: productCategory(activity.type),
        sourceAction: activity.type,
        actorLabel: activity.actorLabel || '시스템',
        actorDetail: null,
        targetTypeLabel: activity.type.startsWith('mapping-') ? 'Mapping' : 'Product',
        targetId: activity.productId,
        targetLabel: product?.name ?? activity.productId,
        targetCode: product?.code ?? null,
        summary: productSummary(activity, product?.name ?? activity.productId),
        changes: fieldChange(activity.target, activity.previousValue, activity.nextValue),
        available: !!product,
        link: product ? { commands: ['/products', product.id] } : null,
      });
    });
  }

  private catalogEvents(): ActivityView[] {
    return this.products.catalogLog().map((activity) => {
      const provider = activity.targetType === 'provider' ? this.products.providerById(activity.targetId) : undefined;
      const model = activity.targetType === 'model' ? this.products.modelById(activity.targetId) : undefined;
      const owner = model ? this.products.providerById(model.providerId) : undefined;
      const link: ActivityLink | null = provider
        ? { commands: ['/providers-models/providers', provider.id] }
        : model && owner
          ? { commands: ['/providers-models/providers', owner.id], queryParams: { section: 'models', model: model.id } }
          : null;
      return this.view({
        id: activity.id,
        timestamp: activity.createdAt,
        module: 'providers-models',
        category: catalogCategory(activity.action),
        sourceAction: activity.action,
        actorLabel: activity.actorLabel || 'Unknown Actor',
        actorDetail: null,
        targetTypeLabel: activity.targetType === 'provider' ? 'Provider' : 'Model',
        targetId: activity.targetId,
        targetLabel: provider?.name ?? model?.name ?? activity.targetId,
        targetCode: provider?.code ?? model?.code ?? null,
        summary: catalogSummary(activity, provider?.name ?? model?.name ?? activity.targetId),
        changes: activity.changes.map((change) => masked(change.field, change.before, change.after)),
        available: !!(provider || model),
        link,
      });
    });
  }

  private planEvents(): ActivityView[] {
    return this.plans.activityLog().map((activity) => {
      const plan = activity.targetType === 'plan' ? this.plans.plans().find((item) => item.id === activity.targetId) : undefined;
      const policy = activity.targetType === 'point-policy' ? this.plans.policies().find((item) => item.id === activity.targetId) : undefined;
      return this.view({
        id: activity.id,
        timestamp: activity.createdAt,
        module: 'plans-points',
        category: catalogCategory(activity.action),
        sourceAction: activity.action,
        actorLabel: activity.actorLabel || 'Unknown Actor',
        actorDetail: null,
        targetTypeLabel: activity.targetType === 'plan' ? 'Plan' : 'Point Policy',
        targetId: activity.targetId,
        targetLabel: plan?.name ?? policy?.name ?? activity.targetId,
        targetCode: plan?.code ?? policy?.code ?? null,
        summary: planSummary(activity, plan?.name ?? policy?.name ?? activity.targetId),
        changes: activity.changes.map((change) => masked(change.field, change.before, change.after)),
        available: !!(plan || policy),
        link: plan || policy
          ? {
              commands: ['/plans-points'],
              queryParams: activity.targetType === 'point-policy' ? { tab: 'point-policies' } : undefined,
            }
          : null,
      });
    });
  }

  private rateEvents(): ActivityView[] {
    return this.usage.history().map((entry) => {
      const card = this.usage.rateCards().find((item) => item.id === entry.rateCardId);
      const provider = card ? this.products.providerById(card.providerId) : undefined;
      const model = card ? this.products.modelById(card.modelId) : undefined;
      const label = provider && model ? `${provider.name} / ${model.name}` : entry.rateCardId;
      return this.view({
        id: entry.id,
        timestamp: entry.updatedAt,
        module: 'usage-costs',
        category: 'updated',
        sourceAction: 'rate-card-updated',
        actorLabel: entry.updatedBy || 'Unknown Actor',
        actorDetail: null,
        targetTypeLabel: 'Rate Card',
        targetId: entry.rateCardId,
        targetLabel: label,
        targetCode: entry.rateCardId,
        summary: `${label} 단가가 변경되었습니다.`,
        changes: rateChanges(entry),
        available: !!card,
        link: card ? { commands: ['/usage-costs'], queryParams: { tab: 'rate-cards' } } : null,
      });
    });
  }

  private adminEvents(): ActivityView[] {
    return this.admins.activities().map((activity) => {
      const admin = activity.targetAdminId ? this.admins.adminById(activity.targetAdminId) : undefined;
      const preset = activity.targetPresetId ? this.admins.presetById(activity.targetPresetId) : undefined;
      const presetEvent = !activity.targetAdminId && !!activity.targetPresetId;
      const targetId = presetEvent ? activity.targetPresetId ?? '' : activity.targetAdminId ?? activity.targetPresetId ?? '';
      const available = presetEvent ? !!preset : !!admin;
      const link: ActivityLink | null = presetEvent && preset
        ? { commands: ['/admin-permissions'], queryParams: { tab: 'presets' } }
        : admin
          ? { commands: ['/admin-permissions'], queryParams: { admin: admin.id, view: 'detail' } }
          : null;
      return this.view({
        id: activity.id,
        timestamp: activity.timestamp,
        module: 'admin-permissions',
        category: adminCategory(activity.action),
        sourceAction: activity.action,
        actorLabel: activity.actorName || 'Unknown Actor',
        actorDetail: null,
        targetTypeLabel: presetEvent ? 'Preset' : 'Admin',
        targetId,
        targetLabel: presetEvent ? preset?.name ?? activity.newValue ?? targetId : admin?.fullName ?? activity.newValue ?? targetId,
        targetCode: presetEvent ? preset?.code ?? null : admin?.email ?? null,
        summary: adminSummary(activity, presetEvent ? preset?.name ?? targetId : admin?.fullName ?? targetId),
        changes: fieldChange(adminField(activity.action), activity.previousValue, activity.newValue),
        available,
        link,
      });
    });
  }

  private incidentEvents(): ActivityView[] {
    const incidents = this.monitoring.incidents();
    return this.monitoring.activities().map((activity) => {
      const incident = incidents.find((item) => item.id === activity.incidentId);
      const title = incident?.title ?? activity.incidentTitle;
      return this.view({
        id: activity.id,
        timestamp: activity.timestamp,
        module: 'system-monitoring',
        category: monitoringCategory(activity.action),
        sourceAction: activity.action,
        actorLabel: activity.actorLabel || 'Demo Operator',
        actorDetail: null,
        targetTypeLabel: 'Incident',
        targetId: activity.incidentId,
        targetLabel: title,
        targetCode: activity.incidentId,
        summary: monitoringSummary(activity, title),
        changes: activity.changes.map((change) => masked(change.field, change.before, change.after)),
        available: !!incident,
        link: incident
          ? { commands: ['/system-monitoring'], queryParams: { tab: 'incidents', incident: activity.incidentId } }
          : null,
      });
    });
  }

  private settingsEvents(): ActivityView[] {
    return this.settings.activities().map((activity) => this.view({
      id: activity.id,
      timestamp: activity.timestamp,
      module: 'settings',
      category: 'updated',
      sourceAction: activity.action,
      actorLabel: activity.actorLabel || 'Demo Administrator',
      actorDetail: null,
      targetTypeLabel: settingsTarget(activity.action),
      targetId: activity.action,
      targetLabel: settingsTarget(activity.action),
      targetCode: null,
      summary: activity.summary,
      changes: activity.changes.map((change) => masked(change.field, change.before, change.after)),
      available: true,
      link: {
        commands: ['/settings'],
        queryParams: activity.action === 'general-updated' ? undefined : { tab: activity.action === 'notifications-updated' ? 'notifications' : 'preferences' },
      },
    }));
  }

  private missingSample(): ActivityView {
    return this.view({
      id: 'sample-activity-9001',
      timestamp: '2026-11-03T02:00:00+09:00',
      module: 'products',
      category: 'status-changed',
      sourceAction: 'sample-missing-target',
      actorLabel: 'Demo Administrator',
      actorDetail: null,
      targetTypeLabel: 'Product',
      targetId: 'product-retired-sample',
      targetLabel: 'Retired Sample',
      targetCode: 'TMP-RETIRED',
      summary: '샘플 목록에서 빠진 제품의 상태 변경입니다. 현재 카탈로그에는 이 제품이 없습니다.',
      changes: [{ field: 'Status', before: '활성', after: '비활성' }],
      available: false,
      link: null,
    });
  }

  private view(input: Omit<ActivityView, 'moduleLabel' | 'actionLabel'>): ActivityView {
    return {
      ...input,
      moduleLabel: MODULE_LABEL[input.module],
      actionLabel: CATEGORY_LABEL[input.category],
      changes: input.changes.filter((change) => change.before !== null || change.after !== null),
    };
  }
}

function organizationCategory(type: OrganizationActivityType): ActivityCategory | null {
  const categories: Record<OrganizationActivityType, ActivityCategory | null> = {
    'organization-created': 'created',
    'organization-updated': 'updated',
    'organization-activated': 'activated',
    'organization-deactivated': 'deactivated',
    'organization-deleted': 'removed',
    'team-created': 'created',
    'team-updated': 'updated',
    'team-deleted': 'removed',
    'product-access-added': 'added',
    'product-access-updated': 'updated',
    'product-access-ended': 'status-changed',
    'product-access-removed': 'removed',
    'product-access-reused': 'updated',
    'usage-recorded': null,
    'user-created': 'created',
    'user-updated': 'updated',
    'user-activated': 'activated',
    'user-deactivated': 'deactivated',
    'user-deleted': 'removed',
    'user-organization-changed': 'updated',
    'user-team-changed': 'updated',
  };
  return categories[type];
}

function organizationActor(activity: OrganizationActivity, users: readonly { id: string; name: string; email: string }[]): { label: string; detail: string | null } {
  if (activity.actorLabel) return { label: activity.actorLabel, detail: null };
  if (!activity.actorId) return { label: '시스템', detail: null };
  const user = users.find((item) => item.id === activity.actorId);
  return user ? { label: user.name, detail: user.email } : { label: 'Unknown Actor', detail: null };
}

function productCategory(type: ProductActivityType): ActivityCategory {
  const categories: Record<ProductActivityType, ActivityCategory> = {
    'product-created': 'created',
    'product-updated': 'updated',
    'product-status-changed': 'status-changed',
    'mapping-added': 'added',
    'mapping-updated': 'updated',
    'mapping-activated': 'activated',
    'mapping-deactivated': 'deactivated',
    'mapping-removed': 'removed',
  };
  return categories[type];
}

function productSummary(activity: ProductActivity, name: string): string {
  const labels: Record<ProductActivityType, string> = {
    'product-created': `${name} 제품이 등록되었습니다.`,
    'product-updated': `${name} 제품 정보가 수정되었습니다.`,
    'product-status-changed': `${name} 상태가 변경되었습니다.`,
    'mapping-added': `${name}에 ${activity.target} 매핑이 추가되었습니다.`,
    'mapping-updated': `${name}의 ${activity.target} 매핑이 수정되었습니다.`,
    'mapping-activated': `${name}의 ${activity.target} 매핑이 활성화되었습니다.`,
    'mapping-deactivated': `${name}의 ${activity.target} 매핑이 비활성화되었습니다.`,
    'mapping-removed': `${name}에서 ${activity.target} 매핑이 제거되었습니다.`,
  };
  return labels[activity.type];
}

function catalogCategory(action: CatalogActivity['action'] | PlanActivity['action']): ActivityCategory {
  if (action === 'created') return 'created';
  if (action === 'status-changed') return 'status-changed';
  return 'updated';
}

function catalogSummary(activity: CatalogActivity, name: string): string {
  if (activity.action === 'created') return `${name}이 등록되었습니다.`;
  if (activity.action === 'status-changed') return `${name} 상태가 변경되었습니다.`;
  return `${name} 정보가 수정되었습니다.`;
}

function planSummary(activity: PlanActivity, name: string): string {
  const kind = activity.targetType === 'plan' ? '플랜' : '포인트 정책';
  if (activity.action === 'created') return `${name} ${kind}이 등록되었습니다.`;
  if (activity.action === 'status-changed') return `${name} ${kind} 상태가 변경되었습니다.`;
  return `${name} ${kind}이 수정되었습니다.`;
}

function adminCategory(action: AdminActivityAction): ActivityCategory {
  const categories: Record<AdminActivityAction, ActivityCategory> = {
    'admin-created': 'created',
    'admin-updated': 'updated',
    'admin-activated': 'activated',
    'admin-deactivated': 'deactivated',
    'preset-assigned': 'permission-changed',
    'custom-permissions-updated': 'permission-changed',
    'preset-created': 'created',
    'preset-updated': 'updated',
    'preset-duplicated': 'created',
  };
  return categories[action];
}

function adminField(action: AdminActivityAction): string {
  if (action === 'admin-activated' || action === 'admin-deactivated') return 'Status';
  if (action === 'preset-assigned' || action === 'custom-permissions-updated' || action.startsWith('preset-')) return 'Permissions';
  return 'Account';
}

function adminSummary(activity: AdminActivity, name: string): string {
  const labels: Record<AdminActivityAction, string> = {
    'admin-created': `${name} 관리자 계정이 등록되었습니다.`,
    'admin-updated': `${name} 관리자 정보가 수정되었습니다.`,
    'admin-activated': `${name} 관리자가 활성으로 표시되었습니다.`,
    'admin-deactivated': `${name} 관리자가 비활성으로 표시되었습니다.`,
    'preset-assigned': `${name}의 권한 Preset이 변경되었습니다.`,
    'custom-permissions-updated': `${name}의 Custom 권한이 변경되었습니다.`,
    'preset-created': `${name} Preset이 등록되었습니다.`,
    'preset-updated': `${name} Preset이 수정되었습니다.`,
    'preset-duplicated': `${activity.previousValue ?? 'Preset'}을 복제해 ${name}을 만들었습니다.`,
  };
  return labels[activity.action];
}

function rateChanges(entry: RateCardHistory): ActivityChange[] {
  return [
    priceChange('Input Price', entry.previousInputPrice, entry.nextInputPrice),
    priceChange('Output Price', entry.previousOutputPrice, entry.nextOutputPrice),
    priceChange('Unit Price', entry.previousUnitPrice, entry.nextUnitPrice),
  ].filter((change): change is ActivityChange => change !== null);
}

function priceChange(field: string, before: number | null, after: number | null): ActivityChange | null {
  if (before === after) return null;
  return { field, before: before === null ? null : `USD ${before}`, after: after === null ? null : `USD ${after}` };
}

function fieldChange(field: string | null, before: string | null, after: string | null): ActivityChange[] {
  if (!field && before === null && after === null) return [];
  return [masked(field || '값', before, after)];
}

function settingsTarget(action: SettingsAction): string {
  if (action === 'general-updated') return 'General Settings';
  if (action === 'notifications-updated') return 'Notification Settings';
  return 'Personal Preferences';
}

function monitoringCategory(action: MonitoringActivityAction): ActivityCategory {
  if (action === 'incident-created') return 'created';
  if (action === 'incident-status-changed') return 'status-changed';
  return 'updated';
}

function monitoringSummary(activity: MonitoringActivity, title: string): string {
  const labels: Record<MonitoringActivityAction, string> = {
    'incident-created': `${title} 장애가 등록되었습니다.`,
    'incident-updated': `${title} 장애 정보가 수정되었습니다.`,
    'incident-status-changed': `${title} 장애 상태가 변경되었습니다.`,
    'incident-severity-changed': `${title} 장애 심각도가 변경되었습니다.`,
    'incident-assignee-changed': `${title} 장애 담당자가 변경되었습니다.`,
  };
  return labels[activity.action];
}

function masked(field: string, before: string | null, after: string | null): ActivityChange {
  const hide = /password|secret|api.?key|token/i.test(field);
  return { field, before: hide && before ? '••••' : before, after: hide && after ? '••••' : after };
}
