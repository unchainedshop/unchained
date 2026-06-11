import { log } from '@unchainedshop/logger';
import { checkAction } from '../../../acl.ts';
import { actions } from '../../../roles/index.ts';
import type { Context } from '../../../context.ts';
import type { Product } from '@unchainedshop/core-products';
import type { User } from '@unchainedshop/core-users';
import type { Order } from '@unchainedshop/core-orders';
import type { Assortment } from '@unchainedshop/core-assortments';
import type { Filter } from '@unchainedshop/core-filters';
import type { Enrollment } from '@unchainedshop/core-enrollments';
import type { Quotation } from '@unchainedshop/core-quotations';
import type { Work } from '@unchainedshop/core-worker';

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

type SearchResultItem = (
  | Product
  | User
  | Order
  | Assortment
  | Filter
  | Enrollment
  | Quotation
  | Work
) & {
  __typename: string;
};

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
  includeInactiveFilters: boolean;
  includeGuestUsers: boolean;
  includeCarts: boolean;
}

const typeNameMap: Record<SearchableEntity, string> = {
  PRODUCT: 'Product',
  USER: 'User',
  ORDER: 'Order',
  ASSORTMENT: 'Assortment',
  FILTER: 'Filter',
  ENROLLMENT: 'Enrollment',
  QUOTATION: 'Quotation',
  WORK: 'Work',
};

async function searchType(
  type: SearchableEntity,
  queryString: string,
  limit: number,
  modules: Context['modules'],
  options: SearchOptions,
): Promise<SearchResultItem[]> {
  let results: (Product | User | Order | Assortment | Filter | Enrollment | Quotation | Work)[];
  switch (type) {
    case 'PRODUCT':
      results = await modules.products.findProducts({
        queryString,
        limit,
        offset: 0,
        includeDrafts: options.includeDraftProducts,
      });
      break;
    case 'USER':
      results = await modules.users.findUsers({
        queryString,
        limit,
        offset: 0,
        includeGuests: options.includeGuestUsers,
      });
      break;
    case 'ORDER':
      results = await modules.orders.findOrders({
        queryString,
        limit,
        offset: 0,
        includeCarts: options.includeCarts,
      });
      break;
    case 'ASSORTMENT':
      results = await modules.assortments.findAssortments({
        queryString,
        limit,
        offset: 0,
        includeInactive: options.includeInactiveAssortments,
      });
      break;
    case 'FILTER':
      results = await modules.filters.findFilters({
        queryString,
        limit,
        offset: 0,
        includeInactive: options.includeInactiveFilters,
      });
      break;
    case 'ENROLLMENT':
      results = await modules.enrollments.findEnrollments({ queryString, limit, offset: 0 });
      break;
    case 'QUOTATION':
      results = await modules.quotations.findQuotations({ queryString, limit, offset: 0 });
      break;
    case 'WORK':
      results = await modules.worker.findWorkQueue({ queryString, limit, skip: 0 });
      break;
    default:
      return [];
  }
  const __typename = typeNameMap[type];
  return results.map((r) => ({ ...r, __typename }));
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
      return modules.assortments.count({
        queryString,
        includeInactive: options.includeInactiveAssortments,
      });
    case 'FILTER':
      return modules.filters.count({ queryString, includeInactive: options.includeInactiveFilters });
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

async function checkTypeAuthorization(
  context: Context,
  types: SearchableEntity[],
): Promise<{ authorized: SearchableEntity[]; unauthorized: Set<SearchableEntity> }> {
  const results = await Promise.allSettled(
    types.map(async (type) => {
      await checkAction(context, typeActionMap[type]);
      return type;
    }),
  );
  const authorized: SearchableEntity[] = [];
  const unauthorized = new Set<SearchableEntity>();
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      authorized.push(types[i]);
    } else {
      unauthorized.add(types[i]);
    }
  });
  return { authorized, unauthorized };
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
    includeInactiveFilters?: boolean;
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
    includeInactiveFilters = true,
    includeGuestUsers = false,
    includeCarts = false,
  } = params;
  const { modules, userId } = context;

  const sanitizedQuery = queryString?.trim().slice(0, 200);
  if (!sanitizedQuery) return { results: [], counts: [] };

  log(`query globalSearch: "${sanitizedQuery}" types: ${types?.join(',') || 'all'}`, { userId });

  const requestedTypes = types?.length ? types : ALL_TYPES;
  const { authorized, unauthorized } = await checkTypeAuthorization(context, requestedTypes);

  const searchOptions: SearchOptions = {
    includeDraftProducts,
    includeInactiveAssortments,
    includeInactiveFilters,
    includeGuestUsers,
    includeCarts,
  };

  const [resultsByType, countsByType] = await Promise.all([
    Promise.all(
      authorized.map((type) =>
        searchType(
          type,
          sanitizedQuery,
          getLimitForType(type, limit, typeLimits),
          modules,
          searchOptions,
        ),
      ),
    ),
    Promise.all(authorized.map((type) => countType(type, sanitizedQuery, modules, searchOptions))),
  ]);

  const results = resultsByType.flat();
  const counts = [
    ...authorized.map((type, i) => ({
      type,
      totalCount: countsByType[i],
      authorized: true,
    })),
    ...[...unauthorized].map((type) => ({
      type,
      totalCount: 0,
      authorized: false,
    })),
  ];

  return { results, counts };
}
