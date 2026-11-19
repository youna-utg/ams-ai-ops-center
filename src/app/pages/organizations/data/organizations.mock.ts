import {
  Organization,
  OrganizationActivity,
  OrganizationProduct,
  OrganizationProductAccess,
  OrganizationProductUsage,
  OrganizationsData,
  OrganizationTeam,
  OrganizationUser,
  UserUsageRecord,
} from '../models/organization.models';

const CREATED_AT = '2026-01-02T09:00:00.000Z';
const UPDATED_AT = '2026-11-18T09:00:00.000Z';

const organizationSeeds = [
  ['ORG-0001', 'Aster Labs', 'Technology'],
  ['ORG-0002', 'Bluewave Finance', 'Finance'],
  ['ORG-0003', 'Clover Health', 'Healthcare'],
  ['ORG-0004', 'Delta Commerce', 'Retail'],
  ['ORG-0005', 'Evergreen Studio', 'Media'],
  ['ORG-0006', 'Futura Mobility', 'Automotive'],
  ['ORG-0007', 'Greenfield Foods', 'Food'],
  ['ORG-0008', 'Harbor Logistics', 'Logistics'],
  ['ORG-0009', 'Insight Academy', 'Education'],
  ['ORG-0010', 'Junction Works', 'Construction'],
  ['ORG-0011', 'Keystone Energy', 'Energy'],
  ['ORG-0012', 'Lumen Hotels', 'Hospitality'],
  ['ORG-0013', 'Mosaic Games', 'Gaming'],
  ['ORG-0014', 'Northstar Legal', 'Legal'],
  ['ORG-0015', 'Orbit Telecom', 'Telecommunications'],
  ['ORG-0016', 'Pioneer Archive', 'Public Sector'],
] as const;

const products: readonly OrganizationProduct[] = [
  'ChangeUp',
  'TimeUp',
  'DeckUp',
  'DocUp',
  'MatchUp',
];

export const MOCK_ORGANIZATIONS: readonly Organization[] = organizationSeeds.map(
  ([code, name, industry], index) => ({
    id: `org-${String(index + 1).padStart(4, '0')}`,
    code,
    name,
    status: index === 4 || index === 11 ? 'inactive' : 'active',
    industry,
    description: `${name}의 AI Ops Center 운영 조직입니다.`,
    contactName: `담당자 ${index + 1}`,
    contactEmail: `admin${index + 1}@example.com`,
    contactPhone: `02-1000-${String(index + 1).padStart(4, '0')}`,
    address: `서울특별시 업무로 ${index + 1}`,
    contractStartDate: `202${4 + (index % 2)}-0${(index % 8) + 1}-01`,
    contractEndDate:
      index % 4 === 0
        ? '2026-06-30'
        : index % 5 === 0
          ? null
          : '2027-12-31',
    memo: index % 3 === 0 ? '제품 도입 확대를 검토 중입니다.' : '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    deletedAt: index === 15 ? '2026-10-01T09:00:00.000Z' : null,
  }),
);

export const MOCK_ORGANIZATION_TEAMS: readonly OrganizationTeam[] =
  MOCK_ORGANIZATIONS.flatMap((organization, index) => {
    const sequence = String(index + 1).padStart(4, '0');
    return [
      {
        id: `team-${sequence}-01`,
        organizationId: organization.id,
        name: '운영팀',
        description: '서비스 운영과 모니터링을 담당합니다.',
        memberIds: [`user-${sequence}-01`],
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
        deletedAt: null,
      },
      {
        id: `team-${sequence}-02`,
        organizationId: organization.id,
        name: '기획팀',
        description: '제품 도입과 활용을 기획합니다.',
        memberIds: index % 4 === 1 || index === 2 ? [] : [`user-${sequence}-02`],
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
        deletedAt: null,
      },
    ];
  });

export const MOCK_ORGANIZATION_USERS: readonly OrganizationUser[] =
  MOCK_ORGANIZATIONS.flatMap((organization, index) => {
    const sequence = String(index + 1).padStart(4, '0');
    return [
      {
        id: `user-${sequence}-01`,
        organizationId: organization.id,
        teamId: `team-${sequence}-01`,
        name: `${organization.name} 관리자`,
        email: `owner${index + 1}@example.com`,
        role: 'Admin',
        jobTitle: '운영 관리자',
        phone: `02-1000-${sequence}`,
        registrationType: 'manual',
        active: true,
        lastLoginAt: index % 6 === 0 ? null : '2026-11-12T08:40:00.000Z',
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
        deletedAt: null,
      },
      {
        id: `user-${sequence}-02`,
        organizationId: organization.id,
        teamId: index % 4 === 1 ? null : `team-${sequence}-02`,
        name: `${organization.name} 사용자`,
        email: `member${index + 1}@example.com`,
        role: 'Member',
        jobTitle: index % 3 === 0 ? '' : '활용 매니저',
        phone: index % 3 === 2 ? '' : `010-2000-${sequence}`,
        registrationType: index % 3 === 0 ? 'bulk' : 'manual',
        active: index % 5 !== 0,
        lastLoginAt: index % 4 === 0 ? null : '2026-10-28T02:15:00.000Z',
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
        deletedAt: index === 2 ? UPDATED_AT : null,
      },
    ];
  });

export const MOCK_PRODUCT_ACCESSES: readonly OrganizationProductAccess[] =
  MOCK_ORGANIZATIONS.flatMap((organization, index) => {
    const sequence = String(index + 1).padStart(4, '0');
    return [0, 1].map((offset): OrganizationProductAccess => {
      const ended = offset === 1 && index % 4 === 0;
      return {
        id: `access-${sequence}-0${offset + 1}`,
        organizationId: organization.id,
        product: products[(index + offset) % products.length],
        status: ended ? 'ended' : 'active',
        seatLimit: 25 + index * 5 + offset * 10,
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: ended ? '2026-09-30T23:59:59.999Z' : null,
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      };
    });
  });

export const MOCK_PRODUCT_USAGE_HISTORY: readonly OrganizationProductUsage[] =
  MOCK_PRODUCT_ACCESSES.flatMap((access, index) =>
    ['2026-09', '2026-10'].map((period, periodIndex) => ({
      id: `usage-${String(index + 1).padStart(4, '0')}-${periodIndex + 1}`,
      organizationId: access.organizationId,
      productAccessId: access.id,
      product: access.product,
      period,
      activeUsers: Math.min(access.seatLimit, 8 + (index % 15) + periodIndex),
      usageCount: 120 + index * 11 + periodIndex * 17,
      recordedAt: `${period}-28T09:00:00.000Z`,
      updatedAt: UPDATED_AT,
    })),
  );

export const MOCK_ORGANIZATION_ACTIVITIES: readonly OrganizationActivity[] =
  MOCK_ORGANIZATIONS.flatMap((organization, index) => [
    {
      id: `activity-${String(index + 1).padStart(4, '0')}-01`,
      organizationId: organization.id,
      type: 'organization-created',
      title: '조직 생성',
      description: `${organization.name} 조직이 생성되었습니다.`,
      actorId: null,
      subjectUserId: null,
      field: null,
      previousValue: null,
      nextValue: null,
      createdAt: organization.createdAt,
      updatedAt: organization.createdAt,
    },
    {
      id: `activity-${String(index + 1).padStart(4, '0')}-02`,
      organizationId: organization.id,
      type: 'usage-recorded',
      title: '제품 사용량 갱신',
      description: '월간 제품 사용량이 갱신되었습니다.',
      actorId: `user-${String(index + 1).padStart(4, '0')}-01`,
      subjectUserId: null,
      field: null,
      previousValue: null,
      nextValue: null,
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT,
    },
    {
      id: `activity-${String(index + 1).padStart(4, '0')}-03`,
      organizationId: organization.id,
      type: 'user-created',
      title: '사용자 등록',
      description: `${organization.name} 관리자 계정이 등록되었습니다.`,
      actorId: null,
      subjectUserId: `user-${String(index + 1).padStart(4, '0')}-01`,
      field: 'User',
      previousValue: null,
      nextValue: `owner${index + 1}@example.com`,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    },
  ]);

const usageProviders = [
  ['OpenAI', 'gpt-4.1'],
  ['Anthropic', 'claude-sonnet'],
  ['Google', 'gemini-2.5'],
] as const;

export const MOCK_USER_USAGE: readonly UserUsageRecord[] = MOCK_ORGANIZATION_USERS.filter(
  (user) => user.id.endsWith('-01') && Number(user.id.slice(5, 9)) % 3 === 1 && !user.deletedAt,
).flatMap((user, index) =>
  [0, 1].map((offset): UserUsageRecord => {
    const [provider, model] = usageProviders[(index + offset) % usageProviders.length];
    const requests = 40 + index * 7 + offset * 11;
    return {
      id: `user-usage-${user.id}-${offset + 1}`,
      userId: user.id,
      organizationId: user.organizationId,
      product: products[(index + offset) % products.length],
      provider,
      model,
      requests,
      inputTokens: requests * 180,
      outputTokens: requests * 70,
      providerCost: Number((requests * 0.018).toFixed(2)),
      occurredAt: offset === 0 ? '2026-10-18T04:20:00.000Z' : '2026-11-09T07:05:00.000Z',
    };
  }),
);

export const ORGANIZATIONS_MOCK_DATA: OrganizationsData = {
  organizations: MOCK_ORGANIZATIONS,
  teams: MOCK_ORGANIZATION_TEAMS,
  users: MOCK_ORGANIZATION_USERS,
  productAccesses: MOCK_PRODUCT_ACCESSES,
  productUsageHistory: MOCK_PRODUCT_USAGE_HISTORY,
  activities: MOCK_ORGANIZATION_ACTIVITIES,
  userUsage: MOCK_USER_USAGE,
};
