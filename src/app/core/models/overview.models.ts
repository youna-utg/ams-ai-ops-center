export type DateRangeKey = '14d' | '30d' | '90d';

export interface TrendSeries {
  labels: string[];
  apiRequests: number[];
  inputTokens: number[];
  outputTokens: number[];
  providerCost: number[];
}

export type ProductStatus = 'Operational' | 'Attention' | 'Maintenance';

export interface ProductOverview {
  product: string;
  domain: string;
  mark: string;
  status: ProductStatus;
  activeUsers: number;
  apiRequests: number;
  tokenUsage: number;
  providerCost: number;
}

export type ActivityStatus = 'Success' | 'Processing' | 'Failed';

export interface RecentActivity {
  activity: string;
  product: string;
  user: string;
  status: ActivityStatus;
  date: string;
}

export interface ProviderUsage {
  provider: string;
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export type HealthStatus = 'Operational' | 'Degraded' | 'Maintenance';

export interface SystemHealthItem {
  label: string;
  detail: string;
  status: HealthStatus;
  uptime?: string;
}
