import { PRODUCT_CATALOG } from '../../organizations/models/organization.models';
import {
  ActionCode,
  CatalogModel,
  CatalogActivity,
  CatalogProduct,
  CatalogProvider,
  ProductActivity,
  ProductMapping,
  ProductsData,
} from '../models/product.models';

const CREATED_AT = '2026-01-02T09:00:00.000Z';
const UPDATED_AT = '2026-11-18T09:00:00.000Z';

const providers: readonly CatalogProvider[] = [
  provider('provider-openai', 'OpenAI', 'TMP-OPENAI', 'llm', 'https://mock.example/openai'),
  provider('provider-anthropic', 'Anthropic', 'TMP-ANTHROPIC', 'llm', 'https://mock.example/anthropic'),
  provider('provider-google', 'Google', 'TMP-GOOGLE', 'llm', 'https://mock.example/google'),
  provider('provider-sample-vision', 'Sample Vision', 'TMP-SAMPLE-VISION', 'non-llm', 'https://mock.example/sample-vision'),
  provider('provider-sample-speech', 'Sample Speech', 'TMP-SAMPLE-SPEECH', 'non-llm', 'https://mock.example/sample-speech'),
];

const models: readonly CatalogModel[] = [
  model('model-gpt-41', 'provider-openai', 'gpt-4.1', 'TMP-GPT-41', 'llm'),
  model('model-gpt-41-mini', 'provider-openai', 'gpt-4.1-mini', 'TMP-GPT-41-MINI', 'llm'),
  model('model-claude-sonnet', 'provider-anthropic', 'claude-sonnet', 'TMP-CLAUDE-SONNET', 'llm'),
  model('model-gemini-25', 'provider-google', 'gemini-2.5', 'TMP-GEMINI-25', 'llm'),
  model('model-sample-vision', 'provider-sample-vision', 'sample-vision-1', 'TMP-SAMPLE-VISION-1', 'non-llm'),
  model('model-sample-speech', 'provider-sample-speech', 'sample-speech-1', 'TMP-SAMPLE-SPEECH-1', 'non-llm'),
];

function provider(
  id: string,
  name: string,
  code: string,
  kind: CatalogProvider['kind'],
  endpoint: string,
): CatalogProvider {
  return {
    id,
    name,
    code,
    kind,
    description: `${name} 샘플 Provider입니다. 코드와 Endpoint는 임시 값이며 실제 연결을 의미하지 않습니다.`,
    endpoint,
    status: 'active',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
}

function model(
  id: string,
  providerId: string,
  name: string,
  code: string,
  kind: CatalogModel['kind'],
): CatalogModel {
  return {
    id,
    providerId,
    name,
    code,
    kind,
    description: `${name} 샘플 Model입니다. 코드는 임시 식별자입니다.`,
    status: 'active',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
}

const actionCodes: readonly ActionCode[] = [
  { id: 'action-sample-translation', code: 'SAMPLE_TRANSLATION', kind: 'llm' },
  { id: 'action-sample-summary', code: 'SAMPLE_SUMMARY', kind: 'llm' },
  { id: 'action-sample-image', code: 'SAMPLE_IMAGE', kind: 'non-llm' },
  { id: 'action-sample-speech', code: 'SAMPLE_SPEECH', kind: 'non-llm' },
];

const products: readonly CatalogProduct[] = (
  Object.entries(PRODUCT_CATALOG) as Array<[string, CatalogProduct['status']]>
).map(([name, status]) => ({
  id: `product-${name.toLowerCase()}`,
  name,
  code: `TMP-${name.toUpperCase()}`,
  description: `${name} 샘플 제품입니다. 코드는 임시 식별자입니다.`,
  status,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}));

const mappings: readonly ProductMapping[] = [
  {
    id: 'mapping-0001',
    productId: 'product-changeup',
    actionCodeId: 'action-sample-translation',
    providerId: 'provider-openai',
    modelId: 'model-gpt-41',
    status: 'active',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'mapping-0002',
    productId: 'product-changeup',
    actionCodeId: 'action-sample-translation',
    providerId: 'provider-anthropic',
    modelId: 'model-claude-sonnet',
    status: 'active',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'mapping-0003',
    productId: 'product-changeup',
    actionCodeId: 'action-sample-summary',
    providerId: 'provider-google',
    modelId: 'model-gemini-25',
    status: 'inactive',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'mapping-0004',
    productId: 'product-changeup',
    actionCodeId: 'action-sample-image',
    providerId: 'provider-sample-vision',
    modelId: 'model-sample-vision',
    status: 'active',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'mapping-0005',
    productId: 'product-deckup',
    actionCodeId: 'action-sample-speech',
    providerId: 'provider-sample-speech',
    modelId: 'model-sample-speech',
    status: 'active',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

const activities: readonly ProductActivity[] = [
  ...products.map((product) => ({
    id: `product-activity-${product.id}`,
    productId: product.id,
    type: 'product-created' as const,
    target: 'Product',
    previousValue: null,
    nextValue: product.code,
    createdAt: product.createdAt,
  })),
  {
    id: 'product-activity-9001',
    productId: 'product-deckup',
    type: 'product-status-changed',
    target: 'Status',
    previousValue: '활성',
    nextValue: '점검',
    actorLabel: 'Demo Administrator',
    createdAt: '2026-11-16T05:00:00.000Z',
  },
  {
    id: 'product-activity-9002',
    productId: 'product-docup',
    type: 'product-updated',
    target: 'Description',
    previousValue: 'DocUp 초안',
    nextValue: 'DocUp 샘플 제품입니다. 코드는 임시 식별자입니다.',
    actorLabel: 'Demo Administrator',
    createdAt: '2026-11-13T02:45:00.000Z',
  },
  {
    id: 'product-activity-9003',
    productId: 'product-changeup',
    type: 'mapping-deactivated',
    target: 'SAMPLE_SUMMARY',
    previousValue: '활성',
    nextValue: '비활성',
    actorLabel: 'Demo Administrator',
    createdAt: '2026-11-09T09:10:00.000Z',
  },
  {
    id: 'product-activity-9004',
    productId: 'product-changeup',
    type: 'mapping-added',
    target: 'SAMPLE_TRANSLATION',
    previousValue: null,
    nextValue: 'OpenAI / gpt-4.1',
    actorLabel: 'Demo Administrator',
    createdAt: '2026-11-04T06:25:00.000Z',
  },
];

const catalogActivities: readonly CatalogActivity[] = [
  {
    id: 'catalog-activity-9001',
    targetType: 'provider',
    targetId: 'provider-openai',
    action: 'updated',
    changes: [{ field: 'Description', before: 'OpenAI 샘플 Provider', after: 'OpenAI 샘플 Provider입니다. 코드와 Endpoint는 임시 값이며 실제 연결을 의미하지 않습니다.' }],
    actorLabel: 'Demo Administrator',
    createdAt: '2026-11-14T03:00:00.000Z',
  },
  {
    id: 'catalog-activity-9002',
    targetType: 'model',
    targetId: 'model-gpt-41-mini',
    action: 'updated',
    changes: [{ field: 'Description', before: 'gpt-4.1-mini 초안', after: 'gpt-4.1-mini 샘플 Model입니다. 코드는 임시 식별자입니다.' }],
    actorLabel: 'Demo Administrator',
    createdAt: '2026-11-07T04:20:00.000Z',
  },
  {
    id: 'catalog-activity-9003',
    targetType: 'provider',
    targetId: 'provider-google',
    action: 'updated',
    changes: [{ field: 'Endpoint', before: 'https://mock.example/google-old', after: 'https://mock.example/google' }],
    actorLabel: 'Demo Administrator',
    createdAt: '2026-10-24T01:30:00.000Z',
  },
];

export const PRODUCTS_MOCK_DATA: ProductsData = {
  products,
  providers,
  models,
  actionCodes,
  mappings,
  activities,
  catalogActivities,
};
