import { log } from '@unchainedshop/logger';
import { SearchFilterQuery } from '@unchainedshop/core-filters';
import { QueryStringRequiredError } from '../../../errors.js';
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
  const { modules, services, userId } = context;
  const forceLiveCollection = false;
  const { queryString, includeInactive, filterQuery, assortmentId, ignoreChildAssortments, ...rest } =
    query;

  log(`query search ${assortmentId} ${JSON.stringify(query)}`, { userId });

  if (assortmentId) {
    const productIds = await modules.assortments.findProductIds({
      assortmentId,
      forceLiveCollection,
      ignoreChildAssortments,
    });
    const filterIds = await modules.assortments.filters.findFilterIds({
      assortmentId,
    });
    return services.filters.searchProducts(
      { queryString, includeInactive, filterQuery, productIds, filterIds, ...rest },
      { forceLiveCollection },
      context,
    );
  }

  if (!queryString) throw new QueryStringRequiredError({});

  return services.filters.searchProducts(
    { queryString, includeInactive, filterQuery, ...rest },
    { forceLiveCollection },
    context,
  );
}
