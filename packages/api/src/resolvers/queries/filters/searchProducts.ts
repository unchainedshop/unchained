import { log } from '@unchainedshop/logger';
import type { SearchFilterQuery } from '@unchainedshop/core-filters';
import type { Context } from '../../../context.ts';

export default async function searchProducts(
  root: never,
  query: {
    assortmentId?: string;
    filterQuery?: SearchFilterQuery;
    ignoreChildAssortments?: boolean;
    includeInactive?: boolean;
    queryString?: string;
    orderBy?: string;
  },
  context: Context,
) {
  const { services, userId, locale } = context;

  log(`query search ${query.assortmentId} ${JSON.stringify(query)}`, { userId });

  return services.filters.searchProducts(query, { locale, userId });
}
