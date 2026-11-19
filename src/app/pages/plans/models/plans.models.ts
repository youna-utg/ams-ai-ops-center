export type RecordStatus = 'active' | 'inactive';
export type PlanType = 'free' | 'trial' | 'point-based' | 'unlimited';
export type CalculationBasis = 'usd' | 'token' | 'request' | 'unit';
export type UnitType = 'page' | 'image' | 'minute' | 'slide';

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  type: PlanType;
  status: RecordStatus;
  grantedPoints: number | null;
  durationDays: number | null;
  requestLimitRpm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PointPolicy {
  id: string;
  name: string;
  code: string;
  description: string;
  status: RecordStatus;
  basis: CalculationBasis;
  usdUnit: number | null;
  pointsPerUsdUnit: number | null;
  tokenUnit: number | null;
  inputPoints: number | null;
  outputPoints: number | null;
  pointsPerRequest: number | null;
  unitType: UnitType | null;
  pointsPerUnit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlansData {
  plans: readonly Plan[];
  policies: readonly PointPolicy[];
}

export type PlanInput = Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>;
export type PolicyInput = Omit<PointPolicy, 'id' | 'createdAt' | 'updatedAt'>;
