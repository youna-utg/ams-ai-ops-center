import { USAGE_CLOCK, shiftDate } from './usage-dates';
import {
  ApiUsageRecord,
  ErrorCategory,
  RateCard,
  RateCardHistory,
} from '../models/usage.models';

interface Lane {
  productId: string;
  providerId: string;
  modelId: string;
  actionCodeId: string;
  organizationId: string;
  userId: string;
  rateCardId: string;
  tokens: boolean;
  inputPrice: number;
  outputPrice: number;
  unitPrice: number;
}

const lanes: readonly Lane[] = [
  { productId: 'product-changeup', providerId: 'provider-openai', modelId: 'model-gpt-41', actionCodeId: 'action-sample-translation', organizationId: 'org-0001', userId: 'user-0001-01', rateCardId: 'rate-0001', tokens: true, inputPrice: 2, outputPrice: 8, unitPrice: 0 },
  { productId: 'product-changeup', providerId: 'provider-anthropic', modelId: 'model-claude-sonnet', actionCodeId: 'action-sample-summary', organizationId: 'org-0001', userId: 'user-0001-01', rateCardId: 'rate-0003', tokens: true, inputPrice: 3, outputPrice: 15, unitPrice: 0 },
  { productId: 'product-timeup', providerId: 'provider-openai', modelId: 'model-gpt-41-mini', actionCodeId: 'action-sample-translation', organizationId: 'org-0002', userId: 'user-0002-01', rateCardId: 'rate-0002', tokens: true, inputPrice: 0.4, outputPrice: 1.6, unitPrice: 0 },
  { productId: 'product-docup', providerId: 'provider-google', modelId: 'model-gemini-25', actionCodeId: 'action-sample-summary', organizationId: 'org-0003', userId: 'user-0003-01', rateCardId: 'rate-0004', tokens: true, inputPrice: 1.25, outputPrice: 5, unitPrice: 0 },
  { productId: 'product-matchup', providerId: 'provider-anthropic', modelId: 'model-claude-sonnet', actionCodeId: 'action-sample-summary', organizationId: 'org-0004', userId: 'user-0004-01', rateCardId: 'rate-0003', tokens: true, inputPrice: 3, outputPrice: 15, unitPrice: 0 },
  { productId: 'product-changeup', providerId: 'provider-sample-vision', modelId: 'model-sample-vision', actionCodeId: 'action-sample-image', organizationId: 'org-0002', userId: 'user-0002-01', rateCardId: 'rate-0005', tokens: false, inputPrice: 0, outputPrice: 0, unitPrice: 0.04 },
  { productId: 'product-deckup', providerId: 'provider-sample-speech', modelId: 'model-sample-speech', actionCodeId: 'action-sample-speech', organizationId: 'org-0005', userId: 'user-0005-01', rateCardId: 'rate-0006', tokens: false, inputPrice: 0, outputPrice: 0, unitPrice: 0.006 },
  { productId: 'product-deckup', providerId: 'provider-google', modelId: 'model-gemini-25', actionCodeId: 'action-sample-summary', organizationId: 'org-0005', userId: 'user-0005-01', rateCardId: 'rate-0004', tokens: true, inputPrice: 1.25, outputPrice: 5, unitPrice: 0 },
];

const failures: readonly { http: number; category: ErrorCategory; message: string }[] = [
  { http: 401, category: 'Authentication Error', message: '샘플 인증 오류입니다. 실제 키는 포함되지 않습니다.' },
  { http: 429, category: 'Rate Limit', message: '샘플 요청 한도 오류입니다.' },
  { http: 504, category: 'Timeout', message: '샘플 시간 초과입니다.' },
  { http: 502, category: 'Provider Error', message: '샘플 Provider 오류입니다.' },
  { http: 400, category: 'Invalid Request', message: '샘플 요청 형식 오류입니다.' },
];

function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function money(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

const next = random(20261120);

export const USAGE_RECORDS: readonly ApiUsageRecord[] = Array.from({ length: 90 }, (_, index) => {
  const lane = lanes[index % lanes.length];
  const dayOffset = Math.floor(index / 2);
  const hour = Math.floor(next() * 24);
  const minute = Math.floor(next() * 60);
  const date = shiftDate(USAGE_CLOCK, -dayOffset);
  const failed = next() < 0.16;
  const failure = failures[Math.floor(next() * failures.length)];
  const inputTokens = lane.tokens ? 400 + Math.floor(next() * 12_000) : null;
  const outputTokens = lane.tokens ? 80 + Math.floor(next() * 4_000) : null;
  const costUsd = lane.tokens
    ? money(((inputTokens ?? 0) / 1_000_000) * lane.inputPrice + ((outputTokens ?? 0) / 1_000_000) * lane.outputPrice)
    : money(lane.unitPrice * (1 + Math.floor(next() * 3)));
  return {
    id: `req_${String(index + 1).padStart(6, '0')}`,
    timestamp: `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`,
    productId: lane.productId,
    organizationId: lane.organizationId,
    userId: lane.userId,
    providerId: lane.providerId,
    modelId: lane.modelId,
    actionCodeId: lane.actionCodeId,
    inputTokens,
    outputTokens,
    latencyMs: failed && failure.category === 'Timeout' ? 8_000 + Math.floor(next() * 4_000) : 180 + Math.floor(next() * 2_400),
    status: failed ? 'error' : 'success',
    httpStatus: failed ? failure.http : 200,
    errorCategory: failed ? failure.category : null,
    errorMessage: failed ? failure.message : null,
    costUsd: failed && failure.category === 'Authentication Error' ? 0 : costUsd,
    appliedRateCardId: lane.rateCardId,
  };
});

const cardTime = '2026-09-01T00:00:00+09:00';

function card(
  id: string,
  providerId: string,
  modelId: string,
  billingUnit: RateCard['billingUnit'],
  inputPrice: number | null,
  outputPrice: number | null,
  unitPrice: number | null,
): RateCard {
  return {
    id,
    providerId,
    modelId,
    billingUnit,
    inputPrice,
    outputPrice,
    unitPrice,
    currency: 'USD',
    effectiveDate: '2026-09-01',
    status: 'active',
    createdAt: cardTime,
    updatedAt: cardTime,
  };
}

export const RATE_CARDS: readonly RateCard[] = [
  card('rate-0001', 'provider-openai', 'model-gpt-41', '1m-tokens', 2, 8, null),
  card('rate-0002', 'provider-openai', 'model-gpt-41-mini', '1m-tokens', 0.4, 1.6, null),
  card('rate-0003', 'provider-anthropic', 'model-claude-sonnet', '1m-tokens', 3, 15, null),
  card('rate-0004', 'provider-google', 'model-gemini-25', '1m-tokens', 1.25, 5, null),
  card('rate-0005', 'provider-sample-vision', 'model-sample-vision', 'image', null, null, 0.04),
  card('rate-0006', 'provider-sample-speech', 'model-sample-speech', 'audio-minute', null, null, 0.006),
];

export const RATE_CARD_HISTORY: readonly RateCardHistory[] = [
  {
    id: 'rate-history-0001',
    rateCardId: 'rate-0001',
    effectiveDate: '2026-09-01',
    previousInputPrice: 2.5,
    previousOutputPrice: 10,
    previousUnitPrice: null,
    nextInputPrice: 2,
    nextOutputPrice: 8,
    nextUnitPrice: null,
    updatedAt: cardTime,
    updatedBy: 'Luna Kim',
  },
  {
    id: 'rate-history-9001',
    rateCardId: 'rate-0002',
    effectiveDate: '2026-11-10',
    previousInputPrice: 0.5,
    previousOutputPrice: 2,
    previousUnitPrice: null,
    nextInputPrice: 0.4,
    nextOutputPrice: 1.6,
    nextUnitPrice: null,
    updatedAt: '2026-11-10T03:15:00+09:00',
    updatedBy: 'Demo Administrator',
  },
];
