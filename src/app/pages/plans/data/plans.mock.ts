import { Plan, PlansData, PointPolicy } from '../models/plans.models';

const CREATED_AT = '2026-01-02T09:00:00.000Z';
const UPDATED_AT = '2026-11-18T09:00:00.000Z';

const sampleNote = '샘플 값입니다. 현재 운영 정책으로 확인된 수치는 아닙니다.';

const plans: readonly Plan[] = [
  {
    id: 'plan-free',
    name: 'Free',
    code: 'TMP-FREE',
    description: `Free 샘플 플랜입니다. ${sampleNote}`,
    type: 'free',
    status: 'active',
    grantedPoints: 100,
    durationDays: null,
    requestLimitRpm: 10,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'plan-trial',
    name: 'Trial',
    code: 'TMP-TRIAL',
    description: `Trial 샘플 플랜입니다. ${sampleNote}`,
    type: 'trial',
    status: 'inactive',
    grantedPoints: 1000,
    durationDays: 7,
    requestLimitRpm: 30,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    code: 'TMP-PRO',
    description: `Pro 샘플 플랜입니다. ${sampleNote}`,
    type: 'point-based',
    status: 'active',
    grantedPoints: 10000,
    durationDays: 30,
    requestLimitRpm: 60,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'plan-pro-plus',
    name: 'Pro+',
    code: 'TMP-PRO-PLUS',
    description: `Pro+ 샘플 플랜입니다. ${sampleNote}`,
    type: 'point-based',
    status: 'active',
    grantedPoints: 50000,
    durationDays: 30,
    requestLimitRpm: 120,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    code: 'TMP-ENTERPRISE',
    description: `Enterprise 샘플 플랜입니다. ${sampleNote}`,
    type: 'unlimited',
    status: 'active',
    grantedPoints: null,
    durationDays: null,
    requestLimitRpm: null,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

const policies: readonly PointPolicy[] = [
  policy('policy-usd', 'Sample USD', 'TMP-POLICY-USD', 'usd', { usdUnit: 1, pointsPerUsdUnit: 1000 }),
  policy('policy-token', 'Sample Token', 'TMP-POLICY-TOKEN', 'token', {
    tokenUnit: 1000,
    inputPoints: 80,
    outputPoints: 160,
  }),
  policy('policy-request', 'Sample Request', 'TMP-POLICY-REQUEST', 'request', { pointsPerRequest: 10 }),
  policy('policy-page', 'Sample Page', 'TMP-POLICY-PAGE', 'unit', { unitType: 'page', pointsPerUnit: 5 }),
  policy('policy-image', 'Sample Image', 'TMP-POLICY-IMAGE', 'unit', { unitType: 'image', pointsPerUnit: 20 }),
  policy('policy-minute', 'Sample Minute', 'TMP-POLICY-MINUTE', 'unit', { unitType: 'minute', pointsPerUnit: 15 }, 'inactive'),
];

function policy(
  id: string,
  name: string,
  code: string,
  basis: PointPolicy['basis'],
  values: Partial<PointPolicy>,
  status: PointPolicy['status'] = 'active',
): PointPolicy {
  return {
    id,
    name,
    code,
    description: `${name} 샘플 정책입니다. ${sampleNote}`,
    status,
    basis,
    usdUnit: null,
    pointsPerUsdUnit: null,
    tokenUnit: null,
    inputPoints: null,
    outputPoints: null,
    pointsPerRequest: null,
    unitType: null,
    pointsPerUnit: null,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...values,
  };
}

export const PLANS_MOCK_DATA: PlansData = { plans, policies };
