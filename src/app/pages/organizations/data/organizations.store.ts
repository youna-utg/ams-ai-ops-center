import { computed, Injectable, signal } from '@angular/core';
import {
  AddOrganizationActivityInput,
  AddProductAccessInput,
  CreateOrganizationInput,
  CreateTeamInput,
  CreateUserInput,
  Organization,
  OrganizationUser,
  OrganizationActivity,
  OrganizationActivityType,
  OrganizationDetail,
  OrganizationProductAccess,
  OrganizationProductUsage,
  OrganizationsData,
  OrganizationTeam,
  RecordProductUsageInput,
  ReuseProductAccessInput,
  UpdateOrganizationActivityInput,
  UpdateOrganizationInput,
  UpdateUserInput,
  UserUsageRecord,
  UpdateProductAccessInput,
  UpdateProductUsageInput,
  UpdateTeamInput,
} from '../models/organization.models';
import { ORGANIZATIONS_MOCK_DATA } from './organizations.mock';

@Injectable({ providedIn: 'root' })
export class OrganizationsStore {
  private readonly state = signal<OrganizationsData>(
    this.cloneData(ORGANIZATIONS_MOCK_DATA),
  );

  readonly organizations = computed(() =>
    this.state().organizations.filter((organization) => !organization.deletedAt),
  );

  readonly teams = computed(() => {
    const organizationIds = new Set(
      this.organizations().map((organization) => organization.id),
    );
    return this.state().teams.filter(
      (team) => !team.deletedAt && organizationIds.has(team.organizationId),
    );
  });

  readonly users = computed(() => {
    const organizationIds = new Set(
      this.organizations().map((organization) => organization.id),
    );
    return this.state().users.filter(
      (user) => !user.deletedAt && organizationIds.has(user.organizationId),
    );
  });

  readonly productAccesses = computed(() => {
    const organizationIds = new Set(
      this.organizations().map((organization) => organization.id),
    );
    return this.state().productAccesses.filter((access) =>
      organizationIds.has(access.organizationId),
    );
  });

  readonly productUsageHistory = computed(() => {
    const organizationIds = new Set(
      this.organizations().map((organization) => organization.id),
    );
    return this.state().productUsageHistory.filter((usage) =>
      organizationIds.has(usage.organizationId),
    );
  });

  readonly userUsage = computed(() => this.state().userUsage);

  readonly activities = computed(() => {
    const organizationIds = new Set(
      this.organizations().map((organization) => organization.id),
    );
    return this.state().activities.filter((activity) =>
      organizationIds.has(activity.organizationId),
    );
  });

  readonly organizationDetails = computed<readonly OrganizationDetail[]>(() =>
    this.organizations().map((organization) =>
      this.buildDetail(organization, this.state()),
    ),
  );

  getOrganizationById(id: string): Organization | undefined {
    return this.organizations().find((organization) => organization.id === id);
  }

  getOrganizationDetail(id: string): OrganizationDetail | undefined {
    const organization = this.getOrganizationById(id);
    return organization ? this.buildDetail(organization, this.state()) : undefined;
  }

  createOrganization(input: CreateOrganizationInput): Organization {
    const current = this.state();
    const now = this.now();
    const organization: Organization = {
      id: this.nextId('org', current.organizations.map(({ id }) => id)),
      code: this.nextOrganizationCode(current.organizations),
      name: input.name,
      status: input.status ?? 'active',
      industry: input.industry ?? '',
      description: input.description ?? '',
      contactName: input.contactName ?? '',
      contactEmail: input.contactEmail ?? '',
      contactPhone: input.contactPhone ?? '',
      address: input.address ?? '',
      contractStartDate: input.contractStartDate,
      contractEndDate: input.contractEndDate ?? null,
      memo: input.memo ?? '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const activity = this.createActivity(
      current,
      organization.id,
      'organization-created',
      '조직 생성',
      `${organization.name} 조직이 생성되었습니다.`,
      now,
    );

    this.state.set({
      ...current,
      organizations: [...current.organizations, organization],
      activities: [...current.activities, activity],
    });
    return organization;
  }

  updateOrganization(id: string, input: UpdateOrganizationInput): Organization {
    const organization = this.requireOrganization(id);
    const now = this.now();
    const updated: Organization = {
      ...organization,
      ...input,
      id: organization.id,
      code: organization.code,
      createdAt: organization.createdAt,
      deletedAt: organization.deletedAt,
      updatedAt: now,
    };
    this.replaceOrganization(updated, 'organization-updated', '조직 정보 수정');
    return updated;
  }

  activateOrganization(id: string): Organization {
    return this.setOrganizationStatus(id, 'active');
  }

  deactivateOrganization(id: string): Organization {
    return this.setOrganizationStatus(id, 'inactive');
  }

  isEmailTaken(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.state().users.some((user) => user.email.toLowerCase() === normalized);
  }

  getUserById(id: string): OrganizationUser | undefined {
    return this.users().find((user) => user.id === id);
  }

  userUsageFor(userId: string): readonly UserUsageRecord[] {
    return this.userUsage().filter((record) => record.userId === userId);
  }

  userHistory(userId: string): readonly OrganizationActivity[] {
    return this.state()
      .activities.filter((activity) => activity.subjectUserId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createUser(input: CreateUserInput): OrganizationUser {
    const current = this.state();
    const now = this.now();
    const email = this.normalizeEmail(input.email);
    this.assertEmailAvailable(email, current);
    this.requireOrganization(input.organizationId);
    const teamId = this.resolveTeam(input.organizationId, input.teamId ?? null, current);
    const user: OrganizationUser = {
      id: this.nextId('user', current.users.map(({ id }) => id)),
      organizationId: input.organizationId,
      teamId,
      name: input.name.trim(),
      email,
      role: 'Member',
      jobTitle: input.jobTitle?.trim() ?? '',
      phone: input.phone?.trim() ?? '',
      registrationType: input.registrationType ?? 'manual',
      active: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const activity = this.createActivity(
      current,
      user.organizationId,
      'user-created',
      '사용자 등록',
      `${user.name} 계정이 등록되었습니다.`,
      now,
      { subjectUserId: user.id, field: 'User', previousValue: null, nextValue: user.email },
    );
    this.state.set({
      ...current,
      users: [...current.users, user],
      teams: this.syncTeamMembership(current.teams, user.id, null, teamId, now),
      activities: [...current.activities, activity],
    });
    return user;
  }

  updateUser(id: string, input: UpdateUserInput): OrganizationUser {
    const current = this.state();
    const user = this.requireUser(id, current);
    const now = this.now();
    const organizationId = input.organizationId ?? user.organizationId;
    this.requireOrganization(organizationId);
    const email =
      input.email === undefined ? user.email : this.normalizeEmail(input.email);
    if (email !== user.email) this.assertEmailAvailable(email, current, user.id);
    const organizationChanged = organizationId !== user.organizationId;
    const requestedTeam = organizationChanged
      ? input.teamId ?? null
      : input.teamId === undefined
        ? user.teamId
        : input.teamId;
    const teamId = this.resolveTeam(organizationId, requestedTeam, current);
    const updated: OrganizationUser = {
      ...user,
      name: input.name?.trim() ?? user.name,
      email,
      organizationId,
      teamId,
      phone: input.phone === undefined ? user.phone : input.phone.trim(),
      jobTitle: input.jobTitle === undefined ? user.jobTitle : input.jobTitle.trim(),
      updatedAt: now,
    };
    const activities = [...current.activities];
    const pushChange = (
      type: OrganizationActivityType,
      title: string,
      field: string,
      previousValue: string | null,
      nextValue: string | null,
      organizationForRecord: string,
    ) => {
      activities.push(
        this.createActivity(
          { ...current, activities },
          organizationForRecord,
          type,
          title,
          `${updated.name}의 ${field}이 변경되었습니다.`,
          now,
          { subjectUserId: user.id, field, previousValue, nextValue },
        ),
      );
    };
    if (updated.name !== user.name || updated.email !== user.email || updated.phone !== user.phone || updated.jobTitle !== user.jobTitle) {
      pushChange('user-updated', '사용자 수정', 'Profile', user.email, updated.email, user.organizationId);
    }
    if (organizationChanged) {
      pushChange(
        'user-organization-changed',
        '고객사 변경',
        'Organization',
        this.organizationName(user.organizationId, current),
        this.organizationName(organizationId, current),
        user.organizationId,
      );
    }
    if (teamId !== user.teamId) {
      pushChange(
        'user-team-changed',
        '팀 변경',
        'Team',
        this.teamLabel(user.teamId, current),
        this.teamLabel(teamId, current),
        organizationId,
      );
    }
    this.state.set({
      ...current,
      users: current.users.map((item) => (item.id === user.id ? updated : item)),
      teams: this.syncTeamMembership(current.teams, user.id, user.teamId, teamId, now),
      activities,
    });
    return updated;
  }

  activateUser(id: string): OrganizationUser {
    return this.setUserActive(id, true);
  }

  deactivateUser(id: string): OrganizationUser {
    return this.setUserActive(id, false);
  }

  deleteUser(id: string): OrganizationUser {
    const current = this.state();
    const user = this.requireUser(id, current);
    const now = this.now();
    const deleted: OrganizationUser = { ...user, teamId: null, updatedAt: now, deletedAt: now };
    const activity = this.createActivity(
      current,
      user.organizationId,
      'user-deleted',
      '사용자 삭제',
      `${user.name} 계정이 삭제되었습니다.`,
      now,
      { subjectUserId: user.id, field: 'Status', previousValue: user.active ? '활성' : '비활성', nextValue: '삭제' },
    );
    this.state.set({
      ...current,
      users: current.users.map((item) => (item.id === user.id ? deleted : item)),
      teams: this.syncTeamMembership(current.teams, user.id, user.teamId, null, now),
      activities: [...current.activities, activity],
    });
    return deleted;
  }

  importUsers(inputs: readonly CreateUserInput[]): readonly OrganizationUser[] {
    const current = this.state();
    const seen = new Set<string>();
    const prepared = inputs.map((input) => {
      const email = this.normalizeEmail(input.email);
      if (seen.has(email)) throw new Error(`파일 안에 중복된 이메일이 있습니다: ${email}`);
      seen.add(email);
      this.assertEmailAvailable(email, current);
      this.requireOrganization(input.organizationId);
      return {
        input,
        email,
        teamId: this.resolveTeam(input.organizationId, input.teamId ?? null, current),
      };
    });
    const now = this.now();
    let users = current.users;
    let teams = current.teams;
    let activities = current.activities;
    const created: OrganizationUser[] = [];
    prepared.forEach(({ input, email, teamId }) => {
      const user: OrganizationUser = {
        id: this.nextId('user', users.map(({ id }) => id)),
        organizationId: input.organizationId,
        teamId,
        name: input.name.trim(),
        email,
        role: 'Member',
        jobTitle: input.jobTitle?.trim() ?? '',
        phone: input.phone?.trim() ?? '',
        registrationType: 'bulk',
        active: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      const activity = this.createActivity(
        { ...current, activities },
        user.organizationId,
        'user-created',
        '사용자 등록',
        `${user.name} 계정이 등록되었습니다.`,
        now,
        { subjectUserId: user.id, field: 'User', previousValue: null, nextValue: user.email },
      );
      users = [...users, user];
      teams = this.syncTeamMembership(teams, user.id, null, teamId, now);
      activities = [...activities, activity];
      created.push(user);
    });
    this.state.set({ ...current, users, teams, activities });
    return created;
  }

  deleteOrganization(id: string): Organization {
    const organization = this.requireOrganization(id);
    const now = this.now();
    const deleted: Organization = {
      ...organization,
      updatedAt: now,
      deletedAt: now,
    };
    this.replaceOrganization(deleted, 'organization-deleted', '조직 삭제');
    return deleted;
  }

  addTeam(organizationId: string, input: CreateTeamInput): OrganizationTeam {
    this.requireOrganization(organizationId);
    const current = this.state();
    const now = this.now();
    const memberIds = this.validateMemberIds(
      organizationId,
      input.memberIds ?? [],
      current,
    );
    const team: OrganizationTeam = {
      id: this.nextId('team', current.teams.map(({ id }) => id)),
      organizationId,
      name: input.name,
      description: input.description ?? '',
      memberIds,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const relations = this.assignMembers(current, team.id, memberIds, now);
    const activity = this.createActivity(
      current,
      organizationId,
      'team-created',
      '팀 추가',
      `${team.name} 팀이 추가되었습니다.`,
      now,
    );

    this.state.set({
      ...current,
      teams: [...relations.teams, team],
      users: relations.users,
      activities: [...current.activities, activity],
    });
    return team;
  }

  updateTeam(teamId: string, input: UpdateTeamInput): OrganizationTeam {
    const current = this.state();
    const team = this.requireTeam(teamId, current);
    const now = this.now();
    const memberIds =
      input.memberIds === undefined
        ? team.memberIds
        : this.validateMemberIds(team.organizationId, input.memberIds, current);
    const updated: OrganizationTeam = {
      ...team,
      ...input,
      id: team.id,
      organizationId: team.organizationId,
      memberIds,
      createdAt: team.createdAt,
      deletedAt: null,
      updatedAt: now,
    };
    const relations = this.assignMembers(current, team.id, memberIds, now);
    const activity = this.createActivity(
      current,
      team.organizationId,
      'team-updated',
      '팀 정보 수정',
      `${updated.name} 팀 정보가 수정되었습니다.`,
      now,
    );

    this.state.set({
      ...current,
      teams: relations.teams.map((item) => (item.id === team.id ? updated : item)),
      users: relations.users,
      activities: [...current.activities, activity],
    });
    return updated;
  }

  deleteTeam(teamId: string): OrganizationTeam {
    const current = this.state();
    const team = this.requireTeam(teamId, current);
    if (team.memberIds.length > 0) {
      throw new Error('멤버가 있는 팀은 삭제할 수 없습니다.');
    }
    const now = this.now();
    const deleted = { ...team, deletedAt: now, updatedAt: now };
    const activity = this.createActivity(
      current,
      team.organizationId,
      'team-deleted',
      '팀 삭제',
      `${team.name} 팀이 삭제되었습니다.`,
      now,
    );
    this.state.set({
      ...current,
      teams: current.teams.map((item) => (item.id === teamId ? deleted : item)),
      activities: [...current.activities, activity],
    });
    return deleted;
  }

  addProductAccess(
    organizationId: string,
    input: AddProductAccessInput,
  ): OrganizationProductAccess {
    this.requireOrganization(organizationId);
    const current = this.state();
    this.assertNoActiveProductAccess(current, organizationId, input.product);
    const now = this.now();
    const access: OrganizationProductAccess = {
      id: this.nextId(
        'access',
        current.productAccesses.map(({ id }) => id),
      ),
      organizationId,
      product: input.product,
      status: 'active',
      seatLimit: input.seatLimit,
      startsAt: input.startsAt ?? now,
      endsAt: input.endsAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.validateSeatLimit(access.seatLimit);
    this.commitProductAccess(
      current,
      access,
      'product-access-added',
      '제품 접근 권한 추가',
      `${access.product} 접근 권한이 추가되었습니다.`,
      true,
    );
    return access;
  }

  updateProductAccess(
    accessId: string,
    input: UpdateProductAccessInput,
  ): OrganizationProductAccess {
    const current = this.state();
    const access = this.requireProductAccess(accessId, current);
    if (access.status === 'ended') {
      throw new Error('종료된 제품 접근 권한은 재사용 후 수정할 수 있습니다.');
    }
    const updated = { ...access, ...input, id: access.id, updatedAt: this.now() };
    this.validateSeatLimit(updated.seatLimit);
    if (updated.product !== access.product) {
      this.assertNoActiveProductAccess(
        current,
        access.organizationId,
        updated.product,
        access.id,
      );
    }
    this.commitProductAccess(
      current,
      updated,
      'product-access-updated',
      '제품 접근 권한 수정',
      `${updated.product} 접근 권한이 수정되었습니다.`,
    );
    return updated;
  }

  endProductAccess(accessId: string, endsAt = this.now()): OrganizationProductAccess {
    const current = this.state();
    const access = this.requireProductAccess(accessId, current);
    if (access.status === 'ended') {
      throw new Error('이미 종료된 제품 접근 권한입니다.');
    }
    const updated: OrganizationProductAccess = {
      ...access,
      status: 'ended',
      endsAt,
      updatedAt: this.now(),
    };
    this.commitProductAccess(
      current,
      updated,
      'product-access-ended',
      '제품 접근 권한 종료',
      `${updated.product} 접근 권한이 종료되었습니다.`,
    );
    return updated;
  }

  renameProduct(previousName: string, nextName: string): void {
    if (previousName === nextName) return;
    const current = this.state();
    this.state.set({
      ...current,
      productAccesses: current.productAccesses.map((access) =>
        access.product === previousName ? { ...access, product: nextName } : access,
      ),
      productUsageHistory: current.productUsageHistory.map((usage) =>
        usage.product === previousName ? { ...usage, product: nextName } : usage,
      ),
      userUsage: current.userUsage.map((usage) =>
        usage.product === previousName ? { ...usage, product: nextName } : usage,
      ),
    });
  }

  removeProductAccess(accessId: string): OrganizationProductAccess {
    const current = this.state();
    const access = this.requireProductAccess(accessId, current);
    if (access.status !== 'ended') {
      throw new Error('활성 제품 접근 권한은 종료 후 제거할 수 있습니다.');
    }
    const now = this.now();
    const activity = this.createActivity(
      current,
      access.organizationId,
      'product-access-removed',
      '제품 접근 권한 제거',
      `${access.product} 접근 권한이 제거되었습니다.`,
      now,
    );
    this.state.set({
      ...current,
      productAccesses: current.productAccesses.filter(
        (item) => item.id !== accessId,
      ),
      activities: [...current.activities, activity],
    });
    return access;
  }

  reuseProductAccess(
    accessId: string,
    input: ReuseProductAccessInput = {},
  ): OrganizationProductAccess {
    const current = this.state();
    const access = this.requireProductAccess(accessId, current);
    if (access.status !== 'ended') {
      throw new Error('종료된 제품 접근 권한만 재사용할 수 있습니다.');
    }
    this.assertNoActiveProductAccess(
      current,
      access.organizationId,
      access.product,
      access.id,
    );
    const now = this.now();
    const updated: OrganizationProductAccess = {
      ...access,
      ...input,
      status: 'active',
      startsAt: input.startsAt ?? now,
      endsAt: input.endsAt ?? null,
      updatedAt: now,
    };
    this.validateSeatLimit(updated.seatLimit);
    this.commitProductAccess(
      current,
      updated,
      'product-access-reused',
      '제품 접근 권한 재사용',
      `${updated.product} 접근 권한이 재사용되었습니다.`,
    );
    return updated;
  }

  recordProductUsage(input: RecordProductUsageInput): OrganizationProductUsage {
    this.requireOrganization(input.organizationId);
    const current = this.state();
    const access = this.requireProductAccess(input.productAccessId, current);
    if (access.organizationId !== input.organizationId) {
      throw new Error('제품 접근 권한이 해당 조직에 속하지 않습니다.');
    }
    const now = this.now();
    const usage: OrganizationProductUsage = {
      ...input,
      id: this.nextId(
        'usage',
        current.productUsageHistory.map(({ id }) => id),
      ),
      product: access.product,
      recordedAt: now,
      updatedAt: now,
    };
    this.validateUsage(usage);
    const activity = this.createActivity(
      current,
      input.organizationId,
      'usage-recorded',
      '제품 사용량 기록',
      `${usage.product} ${usage.period} 사용량이 기록되었습니다.`,
      now,
    );
    this.state.set({
      ...current,
      productUsageHistory: [...current.productUsageHistory, usage],
      activities: [...current.activities, activity],
    });
    return usage;
  }

  updateProductUsage(
    usageId: string,
    input: UpdateProductUsageInput,
  ): OrganizationProductUsage {
    const current = this.state();
    const usage = current.productUsageHistory.find((item) => item.id === usageId);
    if (!usage) {
      throw new Error(`제품 사용 이력을 찾을 수 없습니다: ${usageId}`);
    }
    const updated = { ...usage, ...input, id: usage.id, updatedAt: this.now() };
    this.validateUsage(updated);
    this.state.set({
      ...current,
      productUsageHistory: current.productUsageHistory.map((item) =>
        item.id === usageId ? updated : item,
      ),
    });
    return updated;
  }

  addActivity(input: AddOrganizationActivityInput): OrganizationActivity {
    this.requireOrganization(input.organizationId);
    const current = this.state();
    const now = this.now();
    const activity: OrganizationActivity = {
      ...input,
      id: this.nextId(
        'activity',
        current.activities.map(({ id }) => id),
      ),
      actorId: input.actorId ?? null,
      subjectUserId: null,
      field: null,
      previousValue: null,
      nextValue: null,
      createdAt: now,
      updatedAt: now,
    };
    this.state.set({
      ...current,
      activities: [...current.activities, activity],
    });
    return activity;
  }

  updateActivity(
    activityId: string,
    input: UpdateOrganizationActivityInput,
  ): OrganizationActivity {
    const current = this.state();
    const activity = current.activities.find((item) => item.id === activityId);
    if (!activity) {
      throw new Error(`조직 활동을 찾을 수 없습니다: ${activityId}`);
    }
    const updated = {
      ...activity,
      ...input,
      id: activity.id,
      organizationId: activity.organizationId,
      createdAt: activity.createdAt,
      updatedAt: this.now(),
    };
    this.state.set({
      ...current,
      activities: current.activities.map((item) =>
        item.id === activityId ? updated : item,
      ),
    });
    return updated;
  }

  private setOrganizationStatus(
    id: string,
    status: Organization['status'],
  ): Organization {
    const organization = this.requireOrganization(id);
    if (organization.status === status) {
      return organization;
    }
    const updated = { ...organization, status, updatedAt: this.now() };
    const activated = status === 'active';
    this.replaceOrganization(
      updated,
      activated ? 'organization-activated' : 'organization-deactivated',
      activated ? '조직 활성화' : '조직 비활성화',
    );
    return updated;
  }

  private replaceOrganization(
    organization: Organization,
    activityType: OrganizationActivityType,
    activityTitle: string,
  ): void {
    const current = this.state();
    const activity = this.createActivity(
      current,
      organization.id,
      activityType,
      activityTitle,
      `${organization.name}: ${activityTitle}`,
      organization.updatedAt,
    );
    this.state.set({
      ...current,
      organizations: current.organizations.map((item) =>
        item.id === organization.id ? organization : item,
      ),
      activities: [...current.activities, activity],
    });
  }

  private commitProductAccess(
    current: OrganizationsData,
    access: OrganizationProductAccess,
    activityType: OrganizationActivityType,
    title: string,
    description: string,
    append = false,
  ): void {
    const activity = this.createActivity(
      current,
      access.organizationId,
      activityType,
      title,
      description,
      access.updatedAt,
    );
    this.state.set({
      ...current,
      productAccesses: append
        ? [...current.productAccesses, access]
        : current.productAccesses.map((item) =>
            item.id === access.id ? access : item,
          ),
      activities: [...current.activities, activity],
    });
  }

  private createActivity(
    data: OrganizationsData,
    organizationId: string,
    type: OrganizationActivityType,
    title: string,
    description: string,
    timestamp: string,
    change: Partial<
      Pick<
        OrganizationActivity,
        'subjectUserId' | 'field' | 'previousValue' | 'nextValue' | 'actorId'
      >
    > = {},
  ): OrganizationActivity {
    return {
      id: this.nextId('activity', data.activities.map(({ id }) => id)),
      organizationId,
      type,
      title,
      description,
      actorId: change.actorId ?? null,
      subjectUserId: change.subjectUserId ?? null,
      field: change.field ?? null,
      previousValue: change.previousValue ?? null,
      nextValue: change.nextValue ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private setUserActive(id: string, active: boolean): OrganizationUser {
    const current = this.state();
    const user = this.requireUser(id, current);
    if (user.active === active) return user;
    const now = this.now();
    const updated: OrganizationUser = { ...user, active, updatedAt: now };
    const activity = this.createActivity(
      current,
      user.organizationId,
      active ? 'user-activated' : 'user-deactivated',
      active ? '사용자 활성화' : '사용자 비활성화',
      `${user.name} 계정 상태가 변경되었습니다.`,
      now,
      {
        subjectUserId: user.id,
        field: 'Status',
        previousValue: user.active ? '활성' : '비활성',
        nextValue: active ? '활성' : '비활성',
      },
    );
    this.state.set({
      ...current,
      users: current.users.map((item) => (item.id === user.id ? updated : item)),
      activities: [...current.activities, activity],
    });
    return updated;
  }

  private requireUser(id: string, data: OrganizationsData): OrganizationUser {
    const user = data.users.find((item) => item.id === id && !item.deletedAt);
    if (!user) throw new Error(`사용자를 찾을 수 없습니다: ${id}`);
    this.requireOrganization(user.organizationId);
    return user;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private assertEmailAvailable(
    email: string,
    data: OrganizationsData,
    ignoredUserId?: string,
  ): void {
    const duplicate = data.users.some(
      (user) => user.id !== ignoredUserId && user.email.toLowerCase() === email,
    );
    if (duplicate) throw new Error(`이미 등록된 이메일입니다: ${email}`);
  }

  private resolveTeam(
    organizationId: string,
    teamId: string | null,
    data: OrganizationsData,
  ): string | null {
    if (!teamId) return null;
    const team = data.teams.find(
      (item) => item.id === teamId && !item.deletedAt && item.organizationId === organizationId,
    );
    if (!team) throw new Error('선택한 Team이 해당 Organization에 없습니다.');
    return team.id;
  }

  private organizationName(id: string, data: OrganizationsData): string {
    return data.organizations.find((item) => item.id === id)?.name ?? id;
  }

  private teamLabel(teamId: string | null, data: OrganizationsData): string {
    if (!teamId) return '미지정';
    return data.teams.find((team) => team.id === teamId)?.name ?? '미지정';
  }

  private syncTeamMembership(
    teams: readonly OrganizationTeam[],
    userId: string,
    previousTeamId: string | null,
    nextTeamId: string | null,
    timestamp: string,
  ): readonly OrganizationTeam[] {
    if (previousTeamId === nextTeamId) return teams;
    return teams.map((team) => {
      const withoutUser = team.memberIds.filter((id) => id !== userId);
      const memberIds = team.id === nextTeamId ? [...withoutUser, userId] : withoutUser;
      if (memberIds.length === team.memberIds.length && memberIds.every((id, index) => id === team.memberIds[index])) {
        return team;
      }
      return { ...team, memberIds, updatedAt: timestamp };
    });
  }

  private buildDetail(
    organization: Organization,
    data: OrganizationsData,
  ): OrganizationDetail {
    return {
      organization,
      teams: data.teams.filter(
        (team) =>
          team.organizationId === organization.id && team.deletedAt === null,
      ),
      users: data.users.filter(
        (user) => user.organizationId === organization.id && !user.deletedAt,
      ),
      productAccesses: data.productAccesses.filter(
        (access) => access.organizationId === organization.id,
      ),
      productUsageHistory: data.productUsageHistory.filter(
        (usage) => usage.organizationId === organization.id,
      ),
      activities: data.activities.filter(
        (activity) => activity.organizationId === organization.id,
      ),
    };
  }

  private requireOrganization(id: string): Organization {
    const organization = this.getOrganizationById(id);
    if (!organization) {
      throw new Error(`조직을 찾을 수 없습니다: ${id}`);
    }
    return organization;
  }

  private requireTeam(id: string, data: OrganizationsData): OrganizationTeam {
    const team = data.teams.find(
      (item) => item.id === id && item.deletedAt === null,
    );
    if (!team) {
      throw new Error(`팀을 찾을 수 없습니다: ${id}`);
    }
    this.requireOrganization(team.organizationId);
    return team;
  }

  private requireProductAccess(
    id: string,
    data: OrganizationsData,
  ): OrganizationProductAccess {
    const access = data.productAccesses.find((item) => item.id === id);
    if (!access) {
      throw new Error(`제품 접근 권한을 찾을 수 없습니다: ${id}`);
    }
    this.requireOrganization(access.organizationId);
    return access;
  }

  private validateMemberIds(
    organizationId: string,
    memberIds: readonly string[],
    data: OrganizationsData,
  ): readonly string[] {
    const uniqueIds = [...new Set(memberIds)];
    const validIds = new Set(
      data.users
        .filter((user) => user.organizationId === organizationId && !user.deletedAt)
        .map((user) => user.id),
    );
    const invalidId = uniqueIds.find((id) => !validIds.has(id));
    if (invalidId) {
      throw new Error(`해당 조직에 속하지 않은 멤버입니다: ${invalidId}`);
    }
    return uniqueIds;
  }

  private assignMembers(
    data: OrganizationsData,
    teamId: string,
    memberIds: readonly string[],
    timestamp: string,
  ): Pick<OrganizationsData, 'teams' | 'users'> {
    const memberIdSet = new Set(memberIds);
    return {
      teams: data.teams.map((team) => {
        if (team.id === teamId) {
          return { ...team, memberIds };
        }
        const remainingMemberIds = team.memberIds.filter(
          (id) => !memberIdSet.has(id),
        );
        return remainingMemberIds.length === team.memberIds.length
          ? team
          : {
              ...team,
              memberIds: remainingMemberIds,
              updatedAt: timestamp,
            };
      }),
      users: data.users.map((user) => {
        if (memberIdSet.has(user.id)) {
          return { ...user, teamId, updatedAt: timestamp };
        }
        if (user.teamId === teamId) {
          return { ...user, teamId: null, updatedAt: timestamp };
        }
        return user;
      }),
    };
  }

  private assertNoActiveProductAccess(
    data: OrganizationsData,
    organizationId: string,
    product: OrganizationProductAccess['product'],
    ignoredAccessId?: string,
  ): void {
    const duplicate = data.productAccesses.some(
      (access) =>
        access.id !== ignoredAccessId &&
        access.organizationId === organizationId &&
        access.product === product &&
        access.status === 'active',
    );
    if (duplicate) {
      throw new Error(`${product} 활성 접근 권한이 이미 존재합니다.`);
    }
  }

  private validateSeatLimit(seatLimit: number): void {
    if (!Number.isInteger(seatLimit) || seatLimit < 1) {
      throw new Error('좌석 수는 1 이상의 정수여야 합니다.');
    }
  }

  private validateUsage(usage: OrganizationProductUsage): void {
    if (usage.activeUsers < 0 || usage.usageCount < 0) {
      throw new Error('제품 사용량은 0 이상이어야 합니다.');
    }
  }

  private nextOrganizationCode(
    organizations: readonly Organization[],
  ): string {
    const maximum = organizations.reduce((result, organization) => {
      const match = /^ORG-(\d+)$/.exec(organization.code);
      return Math.max(result, match ? Number(match[1]) : 0);
    }, 0);
    return `ORG-${String(maximum + 1).padStart(4, '0')}`;
  }

  private nextId(prefix: string, ids: readonly string[]): string {
    const maximum = ids.reduce((result, id) => {
      const segments = id.match(/\d+/g);
      const sequence = segments ? Number(segments.join('')) : 0;
      return Math.max(result, sequence);
    }, 0);
    return `${prefix}-${String(maximum + 1).padStart(4, '0')}`;
  }

  private cloneData(data: OrganizationsData): OrganizationsData {
    return {
      organizations: data.organizations.map((item) => ({ ...item })),
      teams: data.teams.map((item) => ({
        ...item,
        memberIds: [...item.memberIds],
      })),
      users: data.users.map((item) => ({ ...item })),
      productAccesses: data.productAccesses.map((item) => ({ ...item })),
      productUsageHistory: data.productUsageHistory.map((item) => ({ ...item })),
      activities: data.activities.map((item) => ({ ...item })),
      userUsage: data.userUsage.map((item) => ({ ...item })),
    };
  }

  private now(): string {
    return new Date().toISOString();
  }
}
