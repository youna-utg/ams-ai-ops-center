import { Injectable, computed, signal } from '@angular/core';
import { RATE_CARDS, RATE_CARD_HISTORY, USAGE_RECORDS } from './usage.mock';
import {
  BillingUnit,
  RateCard,
  RateCardHistory,
  RateCardInput,
  usesDualPrice,
} from '../models/usage.models';

const ACTOR = 'Luna Kim';

@Injectable({ providedIn: 'root' })
export class UsageStore {
  private readonly recordState = signal(USAGE_RECORDS.map((record) => ({ ...record })));
  private readonly cardState = signal(RATE_CARDS.map((card) => ({ ...card })));
  private readonly historyState = signal(RATE_CARD_HISTORY.map((entry) => ({ ...entry })));

  readonly records = computed(() => this.recordState());
  readonly rateCards = computed(() => this.cardState());
  readonly history = computed(() => this.historyState());

  historyFor(rateCardId: string): readonly RateCardHistory[] {
    return this.history()
      .filter((entry) => entry.rateCardId === rateCardId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  createRateCard(input: RateCardInput): RateCard {
    const current = this.cardState();
    const priced = this.normalize(input);
    const now = new Date().toISOString();
    const created: RateCard = {
      ...priced,
      id: this.nextId('rate', current.map((card) => card.id)),
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
    };
    this.cardState.set([...current, created]);
    this.pushHistory(created.id, created.effectiveDate, null, created, now);
    return created;
  }

  updateRateCard(id: string, input: RateCardInput): RateCard {
    const current = this.cardState();
    const existing = this.requireCard(id, current);
    const priced = this.normalize({ ...input, providerId: existing.providerId, modelId: existing.modelId });
    const now = new Date().toISOString();
    const updated: RateCard = {
      ...existing,
      billingUnit: priced.billingUnit,
      inputPrice: priced.inputPrice,
      outputPrice: priced.outputPrice,
      unitPrice: priced.unitPrice,
      effectiveDate: priced.effectiveDate,
      updatedAt: now,
    };
    this.cardState.set(current.map((card) => (card.id === id ? updated : card)));
    const changed =
      existing.billingUnit !== updated.billingUnit ||
      existing.inputPrice !== updated.inputPrice ||
      existing.outputPrice !== updated.outputPrice ||
      existing.unitPrice !== updated.unitPrice ||
      existing.effectiveDate !== updated.effectiveDate;
    if (changed) this.pushHistory(id, updated.effectiveDate, existing, updated, now);
    return updated;
  }

  setRateCardStatus(id: string, status: RateCard['status']): RateCard {
    const current = this.cardState();
    const existing = this.requireCard(id, current);
    if (existing.status === status) return existing;
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    this.cardState.set(current.map((card) => (card.id === id ? updated : card)));
    return updated;
  }

  private normalize(input: RateCardInput): Omit<RateCard, 'id' | 'currency' | 'createdAt' | 'updatedAt'> {
    if (!input.providerId) throw new Error('Provider를 선택해 주세요.');
    if (!input.modelId) throw new Error('Model을 선택해 주세요.');
    if (!this.isUnit(input.billingUnit)) throw new Error('Billing Unit을 선택해 주세요.');
    if (!input.effectiveDate) throw new Error('Effective Date를 입력해 주세요.');
    const dual = usesDualPrice(input.billingUnit);
    const inputPrice = dual ? this.price(input.inputPrice, 'Input Price') : null;
    const outputPrice = dual ? this.price(input.outputPrice, 'Output Price') : null;
    const unitPrice = dual ? null : this.price(input.unitPrice, 'Unit Price');
    return {
      providerId: input.providerId,
      modelId: input.modelId,
      billingUnit: input.billingUnit,
      inputPrice,
      outputPrice,
      unitPrice,
      effectiveDate: input.effectiveDate,
      status: input.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  private price(value: number | null, label: string): number {
    if (value === null || !Number.isFinite(value) || value < 0) throw new Error(`${label}를 확인해 주세요.`);
    return value;
  }

  private isUnit(value: string): value is BillingUnit {
    return ['1m-tokens', '1k-characters', 'request', 'image', 'audio-minute', 'page'].includes(value);
  }

  private requireCard(id: string, cards: readonly RateCard[]): RateCard {
    const card = cards.find((item) => item.id === id);
    if (!card) throw new Error('Rate Card를 찾을 수 없습니다.');
    return card;
  }

  private pushHistory(id: string, effectiveDate: string, previous: RateCard | null, next: RateCard, updatedAt: string): void {
    const entry: RateCardHistory = {
      id: this.nextId('rate-history', this.historyState().map((item) => item.id)),
      rateCardId: id,
      effectiveDate,
      previousInputPrice: previous?.inputPrice ?? null,
      previousOutputPrice: previous?.outputPrice ?? null,
      previousUnitPrice: previous?.unitPrice ?? null,
      nextInputPrice: next.inputPrice,
      nextOutputPrice: next.outputPrice,
      nextUnitPrice: next.unitPrice,
      updatedAt,
      updatedBy: ACTOR,
    };
    this.historyState.set([entry, ...this.historyState()]);
  }

  private nextId(prefix: string, ids: readonly string[]): string {
    const maximum = ids.reduce((result, id) => {
      const digits = id.match(/\d+/g);
      return Math.max(result, digits ? Number(digits.join('')) : 0);
    }, 0);
    return `${prefix}-${String(maximum + 1).padStart(4, '0')}`;
  }
}
