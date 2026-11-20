export type RequestStatus = 'success' | 'error';

export type ErrorCategory =
  | 'Authentication Error'
  | 'Rate Limit'
  | 'Timeout'
  | 'Provider Error'
  | 'Invalid Request';

export type BillingUnit =
  | '1m-tokens'
  | '1k-characters'
  | 'request'
  | 'image'
  | 'audio-minute'
  | 'page';

export type RateCardStatus = 'active' | 'inactive';

export interface ApiUsageRecord {
  id: string;
  timestamp: string;
  productId: string;
  organizationId: string;
  userId: string;
  providerId: string;
  modelId: string;
  actionCodeId: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  status: RequestStatus;
  httpStatus: number;
  errorCategory: ErrorCategory | null;
  errorMessage: string | null;
  costUsd: number;
  appliedRateCardId: string | null;
}

export interface RateCard {
  id: string;
  providerId: string;
  modelId: string;
  billingUnit: BillingUnit;
  inputPrice: number | null;
  outputPrice: number | null;
  unitPrice: number | null;
  currency: 'USD';
  effectiveDate: string;
  status: RateCardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RateCardHistory {
  id: string;
  rateCardId: string;
  effectiveDate: string;
  previousInputPrice: number | null;
  previousOutputPrice: number | null;
  previousUnitPrice: number | null;
  nextInputPrice: number | null;
  nextOutputPrice: number | null;
  nextUnitPrice: number | null;
  updatedAt: string;
  updatedBy: string;
}

export interface RateCardInput {
  providerId: string;
  modelId: string;
  billingUnit: BillingUnit;
  inputPrice: number | null;
  outputPrice: number | null;
  unitPrice: number | null;
  effectiveDate: string;
  status: RateCardStatus;
}

export const DUAL_BILLING_UNITS: readonly BillingUnit[] = ['1m-tokens', '1k-characters'];

export function usesDualPrice(unit: BillingUnit): boolean {
  return DUAL_BILLING_UNITS.includes(unit);
}
