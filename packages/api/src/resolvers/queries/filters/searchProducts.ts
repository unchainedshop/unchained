import { log } from '@unchainedshop/logger';
import { SearchFilterQuery } from '@unchainedshop/core-filters';
import { Context } from '../../../context.js';

export default async function searchProducts(
  root: never,
  query: {
    assortmentId?: string;
    filterQuery?: SearchFilterQuery;
    ignoreChildAssortments: boolean;
    includeInactive: boolean;
    queryString?: string;
    orderBy?: string;
  },
  context: Context,
) {
  const { modules, loaders, services, userId, locale } = context;
  const { queryString, includeInactive, filterQuery, assortmentId, ignoreChildAssortments, ...rest } =
    query;

  log(`query search ${assortmentId} ${JSON.stringify(query)}`, { userId });

  if (assortmentId) {
    const assortment = await loaders.assortmentLoader.load({ assortmentId });
    const productIds = await modules.assortments.findProductIds({
      assortment,
      ignoreChildAssortments,
    });
    const filterIds = await modules.assortments.filters.findFilterIds({
      assortmentId,
    });
    return services.filters.searchProducts(
      { queryString, includeInactive, filterQuery, productIds, filterIds, ...rest },
      { locale: locale, userId },
    );
  }

  return services.filters.searchProducts(
    { queryString, includeInactive, filterQuery, ...rest },
    { locale: locale, userId },
  );
}
