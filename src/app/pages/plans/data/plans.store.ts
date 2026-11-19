import { Injectable, computed, signal } from '@angular/core';
import { Plan, PlanInput, PlansData, PointPolicy, PolicyInput, RecordStatus } from '../models/plans.models';
import { PLANS_MOCK_DATA } from './plans.mock';

@Injectable({ providedIn: 'root' })
export class PlansStore {
  private readonly state = signal<PlansData>(this.clone(PLANS_MOCK_DATA));

  readonly plans = computed(() => this.state().plans);
  readonly policies = computed(() => this.state().policies);

  createPlan(input: PlanInput): Plan {
    const current = this.state();
    const plan = this.normalizePlan(input, current);
    const now = new Date().toISOString();
    const created: Plan = {
      ...plan,
      id: this.nextId('plan', current.plans.map((item) => item.id)),
      createdAt: now,
      updatedAt: now,
    };
    this.state.set({ ...current, plans: [...current.plans, created] });
    return created;
  }

  updatePlan(id: string, input: PlanInput): Plan {
    const current = this.state();
    const existing = this.requirePlan(id, current);
    const plan = this.normalizePlan(input, current, existing);
    const updated: Plan = { ...existing, ...plan, code: existing.code, updatedAt: new Date().toISOString() };
    this.state.set({ ...current, plans: current.plans.map((item) => (item.id === id ? updated : item)) });
    return updated;
  }

  setPlanActive(id: string, active: boolean): Plan {
    return this.setStatus(id, active, 'plan');
  }

  createPolicy(input: PolicyInput): PointPolicy {
    const current = this.state();
    const policy = this.normalizePolicy(input, current);
    const now = new Date().toISOString();
    const created: PointPolicy = {
      ...policy,
      id: this.nextId('policy', current.policies.map((item) => item.id)),
      createdAt: now,
      updatedAt: now,
    };
    this.state.set({ ...current, policies: [...current.policies, created] });
    return created;
  }

  updatePolicy(id: string, input: PolicyInput): PointPolicy {
    const current = this.state();
    const existing = this.requirePolicy(id, current);
    const policy = this.normalizePolicy(input, current, existing);
    const updated: PointPolicy = { ...existing, ...policy, code: existing.code, updatedAt: new Date().toISOString() };
    this.state.set({ ...current, policies: current.policies.map((item) => (item.id === id ? updated : item)) });
    return updated;
  }

  setPolicyActive(id: string, active: boolean): PointPolicy {
    return this.setStatus(id, active, 'policy');
  }

  private setStatus(id: string, active: boolean, kind: 'plan'): Plan;
  private setStatus(id: string, active: boolean, kind: 'policy'): PointPolicy;
  private setStatus(id: string, active: boolean, kind: 'plan' | 'policy'): Plan | PointPolicy {
    const current = this.state();
    const status: RecordStatus = active ? 'active' : 'inactive';
    if (kind === 'plan') {
      const existing = this.requirePlan(id, current);
      if (existing.status === status) return existing;
      const updated = { ...existing, status, updatedAt: new Date().toISOString() };
      this.state.set({ ...current, plans: current.plans.map((item) => (item.id === id ? updated : item)) });
      return updated;
    }
    const existing = this.requirePolicy(id, current);
    if (existing.status === status) return existing;
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    this.state.set({ ...current, policies: current.policies.map((item) => (item.id === id ? updated : item)) });
    return updated;
  }

  private normalizePlan(input: PlanInput, data: PlansData, current?: Plan): PlanInput {
    const name = input.name.trim();
    const code = (current?.code ?? input.code).trim().toUpperCase();
    if (!name) throw new Error('플랜명을 입력해 주세요.');
    if (!code) throw new Error('Plan Code를 입력해 주세요.');
    if (!current || current.code.toLowerCase() !== code.toLowerCase()) this.assertCode(data.plans, code, current?.id);
    this.assertAmount(input.grantedPoints, 'Granted Points');
    this.assertAmount(input.durationDays, 'Duration');
    this.assertAmount(input.requestLimitRpm, 'Request Limit');
    if (input.type !== 'unlimited' && input.grantedPoints === null) throw new Error('Granted Points를 입력해 주세요.');
    if (input.durationDays !== null && input.durationDays < 1) throw new Error('Duration은 1일 이상이어야 합니다.');
    if (input.requestLimitRpm !== null && input.requestLimitRpm < 1) throw new Error('Request Limit은 1 RPM 이상이어야 합니다.');
    return {
      ...input,
      name,
      code,
      description: input.description.trim(),
      grantedPoints: input.type === 'unlimited' ? null : input.grantedPoints,
    };
  }

  private normalizePolicy(input: PolicyInput, data: PlansData, current?: PointPolicy): PolicyInput {
    const name = input.name.trim();
    const code = (current?.code ?? input.code).trim().toUpperCase();
    if (!name) throw new Error('정책명을 입력해 주세요.');
    if (!code) throw new Error('Policy Code를 입력해 주세요.');
    if (!current || current.code.toLowerCase() !== code.toLowerCase()) this.assertCode(data.policies, code, current?.id);
    const cleared = this.clearUnused(input);
    if (cleared.basis === 'usd') {
      this.assertPositive(cleared.usdUnit, 'USD Unit');
      this.assertAmount(cleared.pointsPerUsdUnit, 'Points per USD');
      if (cleared.pointsPerUsdUnit === null) throw new Error('Points per USD를 입력해 주세요.');
    }
    if (cleared.basis === 'token') {
      this.assertPositive(cleared.tokenUnit, 'Token Unit');
      this.assertAmount(cleared.inputPoints, 'Input Points');
      this.assertAmount(cleared.outputPoints, 'Output Points');
      if (cleared.inputPoints === null || cleared.outputPoints === null) throw new Error('Input Points와 Output Points를 입력해 주세요.');
    }
    if (cleared.basis === 'request') {
      this.assertAmount(cleared.pointsPerRequest, 'Points per Request');
      if (cleared.pointsPerRequest === null) throw new Error('Points per Request를 입력해 주세요.');
    }
    if (cleared.basis === 'unit') {
      if (!cleared.unitType) throw new Error('Unit Type을 선택해 주세요.');
      this.assertAmount(cleared.pointsPerUnit, 'Points per Unit');
      if (cleared.pointsPerUnit === null) throw new Error('Points per Unit을 입력해 주세요.');
    }
    return { ...cleared, name, code, description: input.description.trim() };
  }

  private clearUnused(input: PolicyInput): PolicyInput {
    return {
      ...input,
      usdUnit: input.basis === 'usd' ? input.usdUnit : null,
      pointsPerUsdUnit: input.basis === 'usd' ? input.pointsPerUsdUnit : null,
      tokenUnit: input.basis === 'token' ? input.tokenUnit : null,
      inputPoints: input.basis === 'token' ? input.inputPoints : null,
      outputPoints: input.basis === 'token' ? input.outputPoints : null,
      pointsPerRequest: input.basis === 'request' ? input.pointsPerRequest : null,
      unitType: input.basis === 'unit' ? input.unitType : null,
      pointsPerUnit: input.basis === 'unit' ? input.pointsPerUnit : null,
    };
  }

  private assertCode(records: readonly { id: string; code: string }[], code: string, ignoredId?: string): void {
    if (records.some((item) => item.id !== ignoredId && item.code.toLowerCase() === code.toLowerCase())) {
      throw new Error('같은 Code가 있습니다.');
    }
  }

  private assertAmount(value: number | null, label: string): void {
    if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error(`${label}는 0 이상이어야 합니다.`);
  }

  private assertPositive(value: number | null, label: string): void {
    if (value === null || !Number.isFinite(value) || value <= 0) throw new Error(`${label}는 0보다 커야 합니다.`);
  }

  private requirePlan(id: string, data: PlansData): Plan {
    const plan = data.plans.find((item) => item.id === id);
    if (!plan) throw new Error('플랜을 찾을 수 없습니다.');
    return plan;
  }

  private requirePolicy(id: string, data: PlansData): PointPolicy {
    const policy = data.policies.find((item) => item.id === id);
    if (!policy) throw new Error('정책을 찾을 수 없습니다.');
    return policy;
  }

  private nextId(prefix: string, ids: readonly string[]): string {
    const maximum = ids.reduce((result, id) => {
      const digits = id.match(/\d+/g);
      return Math.max(result, digits ? Number(digits.join('')) : 0);
    }, 0);
    return `${prefix}-${String(maximum + 1).padStart(4, '0')}`;
  }

  private clone(data: PlansData): PlansData {
    return {
      plans: data.plans.map((item) => ({ ...item })),
      policies: data.policies.map((item) => ({ ...item })),
    };
  }
}
