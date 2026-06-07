import { log } from '@unchainedshop/logger';
import { checkAction } from '../../../acl.ts';
import { actions } from '../../../roles/index.ts';
import type { Context } from '../../../context.ts';

type SearchableEntity =
  | 'PRODUCT'
  | 'USER'
  | 'ORDER'
  | 'ASSORTMENT'
  | 'FILTER'
  | 'ENROLLMENT'
  | 'QUOTATION'
  | 'WORK';

interface TypeLimitInput {
  type: SearchableEntity;
  limit: number;
}

const ALL_TYPES: SearchableEntity[] = [
  'PRODUCT',
  'USER',
  'ORDER',
  'ASSORTMENT',
  'FILTER',
  'ENROLLMENT',
  'QUOTATION',
  'WORK',
];

const DEFAULT_LIMIT = 5;

const typeActionMap: Record<SearchableEntity, string> = {
  PRODUCT: actions.viewProducts,
  USER: actions.viewUsers,
  ORDER: actions.viewOrders,
  ASSORTMENT: actions.viewAssortments,
  FILTER: actions.viewFilters,
  ENROLLMENT: actions.viewEnrollments,
  QUOTATION: actions.viewQuotations,
  WORK: actions.viewWorkQueue,
};

function getLimitForType(
  type: SearchableEntity,
  defaultLimit: number,
  typeLimits?: TypeLimitInput[],
): number {
  return typeLimits?.find((tl) => tl.type === type)?.limit ?? defaultLimit;
}

interface SearchOptions {
  includeDraftProducts: boolean;
  includeInactiveAssortments: boolean;
  includeGuestUsers: boolean;
  includeCarts: boolean;
}

async function searchType(
  type: SearchableEntity,
  queryString: string,
  limit: number,
  modules: Context['modules'],
  options: SearchOptions,
): Promise<any[]> {
  switch (type) {
    case 'PRODUCT':
      return modules.products.findProducts({
        queryString,
        limit,
        offset: 0,
        includeDrafts: options.includeDraftProducts,
      });
    case 'USER':
      return modules.users.findUsers({
        queryString,
        limit,
        offset: 0,
        includeGuests: options.includeGuestUsers,
      });
    case 'ORDER':
      return modules.orders.findOrders({
        queryString,
        limit,
        offset: 0,
        includeCarts: options.includeCarts,
      });
    case 'ASSORTMENT':
      return modules.assortments.findAssortments({
        queryString,
        limit,
        offset: 0,
        includeInactive: options.includeInactiveAssortments,
      });
    case 'FILTER':
      return modules.filters.findFilters({
        queryString,
        limit,
        offset: 0,
        includeInactive: options.includeInactiveAssortments,
      });
    case 'ENROLLMENT':
      return modules.enrollments.findEnrollments({ queryString, limit, offset: 0 });
    case 'QUOTATION':
      return modules.quotations.findQuotations({ queryString, limit, offset: 0 });
    case 'WORK':
      return modules.worker.findWorkQueue({ queryString, limit, skip: 0 });
    default:
      return [];
  }
}

async function countType(
  type: SearchableEntity,
  queryString: string,
  modules: Context['modules'],
  options: SearchOptions,
): Promise<number> {
  switch (type) {
    case 'PRODUCT':
      return modules.products.count({ queryString, includeDrafts: options.includeDraftProducts });
    case 'USER':
      return modules.users.count({ queryString, includeGuests: options.includeGuestUsers });
    case 'ORDER':
      return modules.orders.count({ queryString, includeCarts: options.includeCarts });
    case 'ASSORTMENT':
      return modules.assortments.count({ queryString, includeInactive: options.includeInactiveAssortments });
    case 'FILTER':
      return modules.filters.count({ queryString, includeInactive: options.includeInactiveAssortments });
    case 'ENROLLMENT':
      return modules.enrollments.count({ queryString });
    case 'QUOTATION':
      return modules.quotations.count({ queryString });
    case 'WORK':
      return modules.worker.count({ queryString });
    default:
      return 0;
  }
}

export default async function globalSearch(
  root: never,
  params: {
    query: string;
    types?: SearchableEntity[];
    limit?: number;
    typeLimits?: TypeLimitInput[];
    includeDraftProducts?: boolean;
    includeInactiveAssortments?: boolean;
    includeGuestUsers?: boolean;
    includeCarts?: boolean;
  },
  context: Context,
) {
  const {
    query: queryString,
    types,
    limit = DEFAULT_LIMIT,
    typeLimits,
    includeDraftProducts = true,
    includeInactiveAssortments = true,
    includeGuestUsers = false,
    includeCarts = false,
  } = params;
  const { modules, userId } = context;

  if (!queryString?.trim()) return { results: [], counts: [] };

  log(`query globalSearch: "${queryString}" types: ${types?.join(',') || 'all'}`, { userId });

  const searchTypes = types?.length ? types : ALL_TYPES;

  await Promise.all(searchTypes.map((type) => checkAction(context, typeActionMap[type])));

  const searchOptions: SearchOptions = {
    includeDraftProducts,
    includeInactiveAssortments,
    includeGuestUsers,
    includeCarts,
  };

  const [resultsByType, countsByType] = await Promise.all([
    Promise.all(
      searchTypes.map((type) =>
        searchType(type, queryString, getLimitForType(type, limit, typeLimits), modules, searchOptions),
      ),
    ),
    Promise.all(searchTypes.map((type) => countType(type, queryString, modules, searchOptions))),
  ]);

  const results = resultsByType.flat();
  const counts = searchTypes.map((type, i) => ({
    type,
    totalCount: countsByType[i],
  }));

  return { results, counts };
}
