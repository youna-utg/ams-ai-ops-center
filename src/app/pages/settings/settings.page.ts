import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { formatKst } from '../usage/data/usage-dates';
import { cloneGeneral, cloneNotifications, clonePreferences } from './data/settings.mock';
import { SettingsStore } from './data/settings.store';
import {
  DATE_FORMATS,
  DELIVERY_CHANNELS,
  DEMO_ACTOR,
  ENVIRONMENT_INFO,
  EVENT_LABEL,
  IncidentNotice,
  LANDING_PAGES,
  NOTICE_PREVIEWS,
  NotificationRule,
  PAGE_SIZES,
  PageSize,
  ReminderTiming,
  RuleId,
  SettingsTab,
  TIMING_LABEL,
  TIMEZONES,
  formatSample,
  landingLabel,
  landingPath,
  sameGeneral,
  sameNotifications,
  samePreferences,
} from './models/settings.models';

type LeaveTarget =
  | { kind: 'tab'; tab: SettingsTab }
  | { kind: 'path'; path: string }
  | { kind: 'route' };

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [IconComponent, StatusBadgeComponent],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(SettingsStore);

  protected readonly tabs = [
    { id: 'general' as const, label: 'General' },
    { id: 'notifications' as const, label: 'Notifications' },
    { id: 'preferences' as const, label: 'Preferences' },
  ];
  protected readonly timezones = TIMEZONES;
  protected readonly dateFormats = DATE_FORMATS;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly landingPages = LANDING_PAGES;
  protected readonly environmentInfo = ENVIRONMENT_INFO;
  protected readonly channels = DELIVERY_CHANNELS;
  protected readonly previews = NOTICE_PREVIEWS;
  protected readonly actorLabel = DEMO_ACTOR;
  protected readonly timingLabel = TIMING_LABEL;
  protected readonly eventLabel = EVENT_LABEL;

  protected readonly tab = signal<SettingsTab>('general');
  protected readonly generalDraft = signal(cloneGeneral(this.store.general()));
  protected readonly notificationDraft = signal(cloneNotifications(this.store.notifications()));
  protected readonly preferenceDraft = signal(clonePreferences(this.store.preferences()));
  protected readonly previewId = signal(NOTICE_PREVIEWS[0].id);
  protected readonly dialog = signal<'reset' | 'leave' | null>(null);
  protected readonly formError = signal('');
  protected readonly toast = signal('');

  private readonly pending = signal<LeaveTarget | null>(null);
  private leaveResolve: ((allow: boolean) => void) | null = null;
  private leaveWait: Promise<boolean> | null = null;
  private revertUrl = false;
  private toastTimer = 0;

  protected readonly dirty = computed(() => {
    if (this.tab() === 'general') return !sameGeneral(this.generalDraft(), this.store.general());
    if (this.tab() === 'notifications') return !sameNotifications(this.notificationDraft(), this.store.notifications());
    return !samePreferences(this.preferenceDraft(), this.store.preferences());
  });

  protected readonly generalPreview = computed(() => formatSample(this.generalDraft().defaultTimezone, this.generalDraft().defaultDateFormat));
  protected readonly preferencePreview = computed(() => {
    const draft = this.preferenceDraft();
    const general = this.store.general();
    const timezone = draft.preferredTimezone === 'system' ? general.defaultTimezone : draft.preferredTimezone;
    const format = draft.preferredDateFormat === 'system' ? general.defaultDateFormat : draft.preferredDateFormat;
    return {
      text: formatSample(timezone, format),
      timezone: draft.preferredTimezone === 'system' ? `시스템 기본값 · ${timezone}` : timezone,
      format: draft.preferredDateFormat === 'system' ? `시스템 기본값 · ${format}` : format,
    };
  });
  protected readonly selectedPreview = computed(() => NOTICE_PREVIEWS.find((item) => item.id === this.previewId()) ?? NOTICE_PREVIEWS[0]);
  protected readonly previewEnabled = computed(() => this.rule(this.selectedPreview().ruleId).enabled);
  protected readonly savedAt = computed(() => {
    const tab = this.tab();
    const stamp = tab === 'general' ? this.store.general().updatedAt : tab === 'notifications' ? this.store.notifications().updatedAt : this.store.preferences().updatedAt;
    return formatKst(stamp);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const requested = query.get('tab');
      const next: SettingsTab = requested === 'notifications' || requested === 'preferences' ? requested : 'general';
      if (this.revertUrl) {
        this.revertUrl = false;
        return;
      }
      if (next === this.tab()) return;
      if (this.dirty()) {
        this.pending.set({ kind: 'tab', tab: next });
        this.dialog.set('leave');
        this.revertUrl = true;
        this.writeTab(this.tab(), true);
        return;
      }
      this.applyTab(next);
    });
    this.destroyRef.onDestroy(() => window.clearTimeout(this.toastTimer));
  }

  @HostListener('window:beforeunload', ['$event'])
  protected warnUnload(event: BeforeUnloadEvent): void {
    if (!this.dirty()) return;
    event.preventDefault();
    event.returnValue = '';
  }

  canLeave(): boolean | Promise<boolean> {
    if (!this.dirty()) return true;
    if (this.leaveWait) return this.leaveWait;
    this.pending.set({ kind: 'route' });
    this.dialog.set('leave');
    this.leaveWait = new Promise((resolve) => {
      this.leaveResolve = resolve;
    });
    return this.leaveWait;
  }

  protected setTab(tab: SettingsTab): void {
    if (tab === this.tab()) return;
    if (this.dirty()) {
      this.pending.set({ kind: 'tab', tab });
      this.dialog.set('leave');
      return;
    }
    this.writeTab(tab, false);
  }

  protected setName(event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    this.generalDraft.update((draft) => ({ ...draft, workspaceDisplayName: value }));
    this.formError.set('');
  }

  protected setDescription(event: Event): void {
    const value = event.target instanceof HTMLTextAreaElement ? event.target.value : '';
    this.generalDraft.update((draft) => ({ ...draft, workspaceDescription: value }));
    this.formError.set('');
  }

  protected setTimezone(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    if (!TIMEZONES.includes(value as (typeof TIMEZONES)[number])) return;
    this.generalDraft.update((draft) => ({ ...draft, defaultTimezone: value as (typeof TIMEZONES)[number] }));
    this.formError.set('');
  }

  protected setDateFormat(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    if (!DATE_FORMATS.includes(value as (typeof DATE_FORMATS)[number])) return;
    this.generalDraft.update((draft) => ({ ...draft, defaultDateFormat: value as (typeof DATE_FORMATS)[number] }));
    this.formError.set('');
  }

  protected toggleRule(id: RuleId): void {
    this.notificationDraft.update((draft) => ({
      ...draft,
      rules: draft.rules.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule),
    }));
    this.formError.set('');
  }

  protected toggleTiming(timing: ReminderTiming): void {
    this.updateRule('product-access-expiry', (rule) => {
      if (!rule.enabled) return rule;
      const selected = new Set(rule.timings);
      if (selected.has(timing)) selected.delete(timing);
      else selected.add(timing);
      return { ...rule, timings: (['7-days', 'on-date'] as const).filter((item) => selected.has(item)) };
    });
  }

  protected toggleEvent(notice: IncidentNotice): void {
    this.updateRule('incident-notifications', (rule) => {
      if (!rule.enabled) return rule;
      const selected = new Set(rule.events);
      if (selected.has(notice)) selected.delete(notice);
      else selected.add(notice);
      return { ...rule, events: (['created', 'status-changed', 'critical'] as const).filter((item) => selected.has(item)) };
    });
  }

  protected setPreview(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : NOTICE_PREVIEWS[0].id;
    if (NOTICE_PREVIEWS.some((item) => item.id === value)) this.previewId.set(value);
  }

  protected setPreferredTimezone(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : 'system';
    if (value !== 'system' && !TIMEZONES.includes(value as (typeof TIMEZONES)[number])) return;
    this.preferenceDraft.update((draft) => ({ ...draft, preferredTimezone: value as typeof draft.preferredTimezone }));
    this.formError.set('');
  }

  protected setPreferredFormat(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : 'system';
    if (value !== 'system' && !DATE_FORMATS.includes(value as (typeof DATE_FORMATS)[number])) return;
    this.preferenceDraft.update((draft) => ({ ...draft, preferredDateFormat: value as typeof draft.preferredDateFormat }));
    this.formError.set('');
  }

  protected setPageSize(event: Event): void {
    const value = Number(event.target instanceof HTMLSelectElement ? event.target.value : 20);
    if (!PAGE_SIZES.includes(value as PageSize)) return;
    this.preferenceDraft.update((draft) => ({ ...draft, defaultPageSize: value as PageSize }));
    this.formError.set('');
  }

  protected setLanding(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : 'dashboard';
    if (!LANDING_PAGES.some((page) => page.id === value)) return;
    this.preferenceDraft.update((draft) => ({ ...draft, defaultLandingPage: value as typeof draft.defaultLandingPage }));
    this.formError.set('');
  }

  protected save(): void {
    const tab = this.tab();
    const result = tab === 'general'
      ? this.store.saveGeneral(this.generalDraft())
      : tab === 'notifications'
        ? this.store.saveNotifications(this.notificationDraft())
        : this.store.savePreferences(this.preferenceDraft());
    if (result.status === 'invalid') {
      this.formError.set(result.message);
      return;
    }
    this.pullDraft(tab);
    this.formError.set('');
    this.showToast(result.status === 'saved' ? savedMessage(tab) : '변경된 내용이 없습니다.');
  }

  protected cancel(): void {
    if (!this.dirty()) return;
    this.pullDraft(this.tab());
    this.formError.set('');
  }

  protected askReset(): void {
    this.dialog.set('reset');
  }

  protected applyReset(): void {
    const tab = this.tab();
    if (tab === 'general') this.generalDraft.set(this.store.generalDefaults());
    else if (tab === 'notifications') this.notificationDraft.set(this.store.notificationDefaults());
    else this.preferenceDraft.set(this.store.preferenceDefaults());
    this.formError.set('');
    this.dialog.set(null);
  }

  protected openLanding(): void {
    const path = landingPath(this.preferenceDraft().defaultLandingPage);
    if (this.dirty()) {
      this.pending.set({ kind: 'path', path });
      this.dialog.set('leave');
      return;
    }
    void this.router.navigateByUrl(path);
  }

  protected keepEditing(): void {
    this.finishLeave(false);
  }

  protected discard(): void {
    const pending = this.pending();
    this.pullDraft(this.tab());
    this.formError.set('');
    this.finishLeave(true);
    if (pending?.kind === 'tab') this.writeTab(pending.tab, false);
    if (pending?.kind === 'path') void this.router.navigateByUrl(pending.path);
  }

  protected rule(id: RuleId): NotificationRule {
    return this.notificationDraft().rules.find((item) => item.id === id) ?? {
      id,
      enabled: false,
      timings: [],
      events: [],
    };
  }

  protected hasTiming(timing: ReminderTiming): boolean {
    return this.rule('product-access-expiry').timings.includes(timing);
  }

  protected hasEvent(notice: IncidentNotice): boolean {
    return this.rule('incident-notifications').events.includes(notice);
  }

  protected landingName(): string {
    return landingLabel(this.preferenceDraft().defaultLandingPage);
  }

  protected previewRows(): number[] {
    return Array.from({ length: Math.min(this.preferenceDraft().defaultPageSize, 5) }, (_, index) => index + 1);
  }

  private applyTab(tab: SettingsTab): void {
    this.tab.set(tab);
    this.formError.set('');
  }

  private writeTab(tab: SettingsTab, replace: boolean): void {
    void this.router.navigate(['/settings'], {
      queryParams: tab === 'general' ? {} : { tab },
      replaceUrl: replace,
    });
  }

  private pullDraft(tab: SettingsTab): void {
    if (tab === 'general') this.generalDraft.set(cloneGeneral(this.store.general()));
    else if (tab === 'notifications') this.notificationDraft.set(cloneNotifications(this.store.notifications()));
    else this.preferenceDraft.set(clonePreferences(this.store.preferences()));
  }

  private updateRule(id: RuleId, change: (rule: NotificationRule) => NotificationRule): void {
    this.notificationDraft.update((draft) => ({
      ...draft,
      rules: draft.rules.map((rule) => rule.id === id ? change(rule) : rule),
    }));
    this.formError.set('');
  }

  private finishLeave(allow: boolean): void {
    this.dialog.set(null);
    this.pending.set(null);
    this.leaveResolve?.(allow);
    this.leaveResolve = null;
    this.leaveWait = null;
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 2400);
  }
}

function savedMessage(tab: SettingsTab): string {
  if (tab === 'general') return '일반 설정을 저장했습니다.';
  if (tab === 'notifications') return '알림 설정을 저장했습니다.';
  return '개인 설정을 저장했습니다.';
}
