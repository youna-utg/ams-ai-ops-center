export type NavIcon =
  | 'overview'
  | 'products'
  | 'users'
  | 'projects'
  | 'providers'
  | 'pricing'
  | 'usage'
  | 'logs'
  | 'plans'
  | 'points'
  | 'admin'
  | 'permissions'
  | 'health'
  | 'settings';

export interface NavItem {
  label: string;
  path: string;
  description: string;
  icon: NavIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Provisional IA for the publishing prototype.
 * Only Dashboard is content-complete in later phases;
 * remaining destinations use placeholder pages.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/overview',
        description: '제품, 플랫폼 활동, AI 운영 현황을 한눈에 확인합니다.',
        icon: 'overview',
      },
    ],
  },
  {
    label: 'Product Management',
    items: [
      {
        label: 'Products',
        path: '/products',
        description: '제품 포트폴리오와 운영 설정을 관리합니다.',
        icon: 'products',
      },
      {
        label: 'Product Users',
        path: '/product-users',
        description: '제품별 사용자와 계정 상태를 확인합니다.',
        icon: 'users',
      },
      {
        label: 'Projects',
        path: '/projects',
        description: '제품 프로젝트와 운영 맥락을 확인합니다.',
        icon: 'projects',
      },
    ],
  },
  {
    label: 'AI Operations',
    items: [
      {
        label: 'Providers & Models',
        path: '/providers-models',
        description: 'AI Provider와 사용 가능한 Model 목록을 구성합니다.',
        icon: 'providers',
      },
      {
        label: 'Provider Pricing',
        path: '/provider-pricing',
        description: 'Provider에 지불하는 Model 가격 정보를 확인합니다.',
        icon: 'pricing',
      },
      {
        label: 'Usage & Cost',
        path: '/usage-cost',
        description: 'Provider 사용량과 회사가 지불하는 외부 비용을 확인합니다.',
        icon: 'usage',
      },
      {
        label: 'Logs',
        path: '/logs',
        description: 'AI 운영 및 요청 로그를 확인합니다.',
        icon: 'logs',
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Plans',
        path: '/plans',
        description: '서비스 Plan 정의를 관리합니다.',
        icon: 'plans',
      },
      {
        label: 'Point Policies',
        path: '/point-policies',
        description: '포인트 정책 정의를 관리합니다.',
        icon: 'points',
      },
      {
        label: 'Admin Accounts',
        path: '/admin-accounts',
        description: '관리자 계정과 계정 상태를 확인합니다.',
        icon: 'admin',
      },
      {
        label: 'Roles & Permissions',
        path: '/roles-permissions',
        description: '역할과 권한 관리 구조를 준비합니다.',
        icon: 'permissions',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'System Health',
        path: '/system-health',
        description: '플랫폼 상태와 운영 신호를 확인합니다.',
        icon: 'health',
      },
      {
        label: 'Settings',
        path: '/settings',
        description: '콘솔 환경과 시스템 설정을 구성합니다.',
        icon: 'settings',
      },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
