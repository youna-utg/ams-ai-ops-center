export type NavIcon =
  | 'overview'
  | 'organizations'
  | 'users'
  | 'products'
  | 'plans'
  | 'points'
  | 'providers'
  | 'usage'
  | 'analytics'
  | 'pricing'
  | 'admin'
  | 'permissions'
  | 'history'
  | 'health'
  | 'logs'
  | 'settings';

export interface NavTab {
  id: string;
  label: string;
  description: string;
  plannedSections: string[];
}

export interface NavItem {
  label: string;
  path: string;
  description: string;
  icon: NavIcon;
  tabs?: NavTab[];
  plannedSections?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * IA v1.1 draft for the publishing prototype.
 * Only Dashboard is content-complete; other destinations use placeholder pages.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/overview',
        description: '전체 운영 현황',
        icon: 'overview',
      },
    ],
  },
  {
    label: 'Customer Management',
    items: [
      {
        label: 'Organizations',
        path: '/organizations',
        description: '고객사 및 팀',
        icon: 'organizations',
        plannedSections: ['고객사 요약', '검색 및 필터', 'Organization 목록', 'Organization 상세'],
      },
      {
        label: 'Users',
        path: '/users',
        description: '통합 사용자',
        icon: 'users',
        plannedSections: ['사용자 요약', '검색 및 필터', 'User 목록', 'User 상세'],
      },
    ],
  },
  {
    label: 'Product Management',
    items: [
      {
        label: 'Products',
        path: '/products',
        description: '제품 및 제품별 AI 연결',
        icon: 'products',
        plannedSections: ['제품 요약', 'Product 목록', 'Product 등록', 'Provider & Model 연결'],
      },
      {
        label: 'Plans & Points',
        path: '/plans-points',
        description: '서비스 플랜과 포인트 정책',
        icon: 'plans',
        tabs: [
          {
            id: 'plans',
            label: 'Plans',
            description: '서비스 이용 조건과 플랜을 관리합니다.',
            plannedSections: ['Plan 목록', 'Plan 상세', '이용 한도 및 상태'],
          },
          {
            id: 'point-policies',
            label: 'Point Policies',
            description: '사용량에 따른 포인트 계산 규칙을 관리합니다.',
            plannedSections: ['정책 목록', '계산 기준', '사용 단위별 포인트'],
          },
        ],
      },
    ],
  },
  {
    label: 'AI Operations',
    items: [
      {
        label: 'Providers & Models',
        path: '/providers-models',
        description: 'AI 제공업체 및 모델',
        icon: 'providers',
        tabs: [
          {
            id: 'providers',
            label: 'Providers',
            description: '외부 AI Provider와 연결 정보를 관리합니다.',
            plannedSections: ['Provider 요약', 'Provider 목록', '연결 설정'],
          },
          {
            id: 'models',
            label: 'Models',
            description: 'Provider별 Model 정보와 상태를 관리합니다.',
            plannedSections: ['Model 목록', 'Model 상세', '연결 제품'],
          },
        ],
      },
      {
        label: 'Usage & Costs',
        path: '/usage-costs',
        description: 'AI 사용량, Provider 비용 및 단가',
        icon: 'usage',
        tabs: [
          {
            id: 'api-usage',
            label: 'API Usage',
            description: 'API 요청, 토큰, 오류 및 응답 시간을 분석합니다.',
            plannedSections: ['사용량 KPI', '사용량 추이', 'Request History'],
          },
          {
            id: 'cost-analytics',
            label: 'Cost Analytics',
            description: '외부 AI Provider 비용을 분석합니다.',
            plannedSections: ['비용 KPI', '비용 추이와 분포', 'Cost Breakdown'],
          },
          {
            id: 'rate-cards',
            label: 'Rate Cards',
            description: 'Provider와 Model별 외부 API 이용 단가를 관리합니다.',
            plannedSections: ['단가 목록', '단가 상세', 'Pricing History'],
          },
        ],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Admin & Permissions',
        path: '/admin-permissions',
        description: '내부 관리자 계정과 접근 권한',
        icon: 'admin',
        tabs: [
          {
            id: 'admin-accounts',
            label: 'Admin Accounts',
            description: '내부 관리자 계정과 상태를 관리합니다.',
            plannedSections: ['관리자 목록', '관리자 상세', '로그인 이력'],
          },
          {
            id: 'permissions',
            label: 'Permissions',
            description: '관리자별 접근 권한을 관리합니다.',
            plannedSections: ['관리자 선택', '권한 그룹', '권한 저장'],
          },
          {
            id: 'presets',
            label: 'Presets',
            description: '반복해서 사용하는 권한 구성을 관리합니다.',
            plannedSections: ['Preset 목록', '권한 구성', '적용 관리자'],
          },
        ],
      },
      {
        label: 'Activity History',
        path: '/activity-history',
        description: '관리 활동 및 변경 이력',
        icon: 'history',
        plannedSections: ['Activity 필터', 'Activity 목록', '변경 전후 데이터', 'Activity 상세'],
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'System Monitoring',
        path: '/system-monitoring',
        description: '시스템 상태, 기술 로그 및 장애 이력',
        icon: 'health',
        tabs: [
          {
            id: 'health',
            label: 'Health',
            description: '주요 서비스 상태와 가용성을 확인합니다.',
            plannedSections: ['상태 카드', '가용성 추이', '응답 시간'],
          },
          {
            id: 'system-logs',
            label: 'System Logs',
            description: '서버와 애플리케이션의 기술 로그를 조회합니다.',
            plannedSections: ['로그 필터', '로그 목록', '기술 상세'],
          },
          {
            id: 'incidents',
            label: 'Incidents',
            description: '장애 발생부터 해결까지의 이력을 관리합니다.',
            plannedSections: ['장애 목록', '영향 서비스', '해결 타임라인'],
          },
        ],
      },
      {
        label: 'Settings',
        path: '/settings',
        description: '공통 운영 설정',
        icon: 'settings',
        tabs: [
          {
            id: 'general',
            label: 'General',
            description: '언어, 시간대 및 날짜 형식을 설정합니다.',
            plannedSections: ['Language', 'Timezone', 'Date Format'],
          },
          {
            id: 'notifications',
            label: 'Notifications',
            description: '알림 수신과 경고 기준을 설정합니다.',
            plannedSections: ['Notification Preferences', 'Alert Settings'],
          },
          {
            id: 'preferences',
            label: 'Preferences',
            description: '표 밀도와 페이지 표시 방식을 설정합니다.',
            plannedSections: ['Table Density', 'Pagination', 'Columns'],
          },
        ],
      },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
