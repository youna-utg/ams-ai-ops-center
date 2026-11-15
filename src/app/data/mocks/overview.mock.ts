import {
  DateRangeKey,
  ProductOverview,
  ProviderUsage,
  RecentActivity,
  SystemHealthItem,
  TrendSeries,
} from '../../core/models/overview.models';

export const TREND_DATA: Record<DateRangeKey, TrendSeries> = {
  '14d': {
    labels: [
      '11/02',
      '11/03',
      '11/04',
      '11/05',
      '11/06',
      '11/07',
      '11/08',
      '11/09',
      '11/10',
      '11/11',
      '11/12',
      '11/13',
      '11/14',
      '11/15',
    ],
    apiRequests: [
      640, 680, 650, 740, 790, 770, 830, 800, 880, 930, 890, 960, 1010, 1040,
    ],
    inputTokens: [
      0.38, 0.41, 0.39, 0.44, 0.47, 0.46, 0.49, 0.48, 0.52, 0.55, 0.53, 0.57,
      0.6, 0.62,
    ],
    outputTokens: [
      0.1, 0.11, 0.1, 0.11, 0.12, 0.12, 0.13, 0.12, 0.13, 0.14, 0.13, 0.15,
      0.15, 0.16,
    ],
    providerCost: [
      9.2, 9.8, 9.4, 10.6, 11.4, 11, 11.8, 11.4, 12.6, 13.2, 12.8, 13.8, 14.6,
      15.1,
    ],
  },
  '30d': {
    labels: [
      '10/17',
      '10/19',
      '10/21',
      '10/23',
      '10/25',
      '10/27',
      '10/29',
      '10/31',
      '11/02',
      '11/04',
      '11/06',
      '11/08',
      '11/10',
      '11/12',
      '11/15',
    ],
    apiRequests: [
      1380, 1440, 1400, 1500, 1570, 1620, 1590, 1680, 1730, 1770, 1830, 1880,
      1920, 1980, 2080,
    ],
    inputTokens: [
      0.72, 0.76, 0.74, 0.8, 0.84, 0.86, 0.84, 0.9, 0.93, 0.96, 1.01, 1.04,
      1.07, 1.11, 1.18,
    ],
    outputTokens: [
      0.18, 0.19, 0.19, 0.2, 0.21, 0.22, 0.21, 0.23, 0.23, 0.24, 0.25, 0.26,
      0.27, 0.28, 0.3,
    ],
    providerCost: [
      18, 18.6, 18.1, 19.4, 20.2, 21, 20.6, 21.8, 22.6, 23.1, 24, 24.6, 25.2,
      26, 26.3,
    ],
  },
  '90d': {
    labels: [
      '08/18',
      '08/25',
      '09/01',
      '09/08',
      '09/15',
      '09/22',
      '09/29',
      '10/06',
      '10/13',
      '10/20',
      '10/27',
      '11/03',
      '11/10',
      '11/15',
    ],
    apiRequests: [
      4100, 4300, 4500, 4400, 4780, 4980, 5200, 5440, 5680, 5950, 6260, 6560,
      6940, 7340,
    ],
    inputTokens: [
      2.2, 2.3, 2.4, 2.4, 2.6, 2.7, 2.8, 3, 3.1, 3.3, 3.5, 3.6, 3.9, 4.1,
    ],
    outputTokens: [
      0.55, 0.58, 0.6, 0.59, 0.65, 0.68, 0.71, 0.74, 0.78, 0.82, 0.87, 0.91,
      0.97, 1.03,
    ],
    providerCost: [
      48, 51, 53, 52, 56, 59, 62, 66, 69, 73, 77, 81, 87, 92,
    ],
  },
};

export const PRODUCTS: ProductOverview[] = [
  {
    product: 'ChangeUp',
    domain: 'Webtoon',
    mark: 'CU',
    status: 'Operational',
    activeUsers: 24,
    apiRequests: 8440,
    tokenUsage: 3508000,
    providerCost: 82.4,
  },
  {
    product: 'TimeUp',
    domain: 'Video',
    mark: 'TU',
    status: 'Operational',
    activeUsers: 18,
    apiRequests: 6700,
    tokenUsage: 5142000,
    providerCost: 119.6,
  },
  {
    product: 'DeckUp',
    domain: 'Presentation',
    mark: 'DU',
    status: 'Attention',
    activeUsers: 12,
    apiRequests: 2520,
    tokenUsage: 1420000,
    providerCost: 39,
  },
  {
    product: 'DocUp',
    domain: 'Document',
    mark: 'DO',
    status: 'Operational',
    activeUsers: 19,
    apiRequests: 5610,
    tokenUsage: 2814000,
    providerCost: 65.3,
  },
  {
    product: 'MatchUp',
    domain: 'Translation QA',
    mark: 'MU',
    status: 'Maintenance',
    activeUsers: 9,
    apiRequests: 2070,
    tokenUsage: 868000,
    providerCost: 23.2,
  },
];

export const PROVIDER_USAGE: ProviderUsage[] = [
  {
    provider: 'OpenAI',
    model: 'GPT-4.1',
    requests: 9670,
    inputTokens: 4300000,
    outputTokens: 1140000,
    totalCost: 133.6,
  },
  {
    provider: 'Anthropic',
    model: 'Claude 3.7 Sonnet',
    requests: 6650,
    inputTokens: 3110000,
    outputTokens: 880000,
    totalCost: 102.3,
  },
  {
    provider: 'Google',
    model: 'Gemini 2.5 Pro',
    requests: 5330,
    inputTokens: 2500000,
    outputTokens: 710000,
    totalCost: 56.8,
  },
  {
    provider: 'Azure AI',
    model: 'Document Intelligence',
    requests: 2480,
    inputTokens: 1020000,
    outputTokens: 0,
    totalCost: 22.5,
  },
  {
    provider: 'DeepL',
    model: 'DeepL API Pro',
    requests: 1210,
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 14.3,
  },
];

export const RECENT_ACTIVITIES: RecentActivity[] = [
  {
    activity: '번역 작업 배치 완료',
    product: 'ChangeUp',
    user: '김서연',
    status: 'Success',
    date: '2026-11-15 13:42',
  },
  {
    activity: 'Provider Model 설정 변경',
    product: 'AMS',
    user: 'Luna Kim',
    status: 'Success',
    date: '2026-11-15 13:18',
  },
  {
    activity: '영상 자막 생성 처리 중',
    product: 'TimeUp',
    user: '이도윤',
    status: 'Processing',
    date: '2026-11-15 12:56',
  },
  {
    activity: '문서 분석 요청 실패',
    product: 'DocUp',
    user: '박지민',
    status: 'Failed',
    date: '2026-11-15 12:31',
  },
  {
    activity: 'QA 프로젝트 생성',
    product: 'MatchUp',
    user: '최유진',
    status: 'Success',
    date: '2026-11-15 11:48',
  },
];

export const SYSTEM_HEALTH: SystemHealthItem[] = [
  {
    label: 'Overall Status',
    detail: '모든 핵심 서비스 정상',
    status: 'Operational',
    uptime: '99.98%',
  },
  {
    label: 'Database',
    detail: '응답 시간 18ms',
    status: 'Operational',
  },
  {
    label: 'Redis',
    detail: '메모리 사용률 61%',
    status: 'Operational',
  },
  {
    label: 'Queue',
    detail: '대기 작업 24건',
    status: 'Degraded',
  },
  {
    label: 'API Status',
    detail: '응답 시간 142ms',
    status: 'Operational',
  },
];

export const COST_BY_PROVIDER = {
  labels: ['OpenAI', 'Anthropic', 'Google', 'Azure AI', 'DeepL'],
  values: [133.6, 102.3, 56.8, 22.5, 14.3],
};

export const COST_BY_MODEL = {
  labels: [
    'GPT-4.1',
    'Claude 3.7 Sonnet',
    'Gemini 2.5 Pro',
    'Document Intelligence',
    'DeepL API Pro',
  ],
  values: [133.6, 102.3, 56.8, 22.5, 14.3],
};
