export type ActivityModule =
  | 'organizations'
  | 'users'
  | 'products'
  | 'plans-points'
  | 'providers-models'
  | 'usage-costs'
  | 'admin-permissions'
  | 'system-monitoring'
  | 'settings';

export type ActivityCategory =
  | 'created'
  | 'updated'
  | 'status-changed'
  | 'added'
  | 'removed'
  | 'activated'
  | 'deactivated'
  | 'permission-changed';

export interface ActivityChange {
  field: string;
  before: string | null;
  after: string | null;
}

export interface ActivityLink {
  commands: string[];
  queryParams?: Record<string, string>;
}

export interface ActivityView {
  id: string;
  timestamp: string;
  module: ActivityModule;
  moduleLabel: string;
  category: ActivityCategory;
  actionLabel: string;
  sourceAction: string;
  actorLabel: string;
  actorDetail: string | null;
  targetTypeLabel: string;
  targetId: string;
  targetLabel: string;
  targetCode: string | null;
  summary: string;
  changes: readonly ActivityChange[];
  available: boolean;
  link: ActivityLink | null;
}
