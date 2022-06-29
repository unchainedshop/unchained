import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { SearchFilterQuery } from '@unchainedshop/types/filters';
import { QueryStringRequiredError } from '../../../errors';

export default async function searchProducts(
  root: Root,
  query: {
    assortmentId?: string;
    filterQuery?: SearchFilterQuery;
    ignoreChildAssortments: boolean;
    includeInactive: boolean;
    queryString?: string;
  },
  context: Context,
) {
  const { modules, userId } = context;
  const forceLiveCollection = false;
  const { queryString, includeInactive, filterQuery, assortmentId, ignoreChildAssortments } = query;

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
    return modules.filters.search.searchProducts(
      { queryString, includeInactive, filterQuery, productIds, filterIds },
      { forceLiveCollection },
      context,
    );
  }

  if (!queryString) throw new QueryStringRequiredError({});

  return modules.filters.search.searchProducts(
    { queryString, includeInactive, filterQuery },
    { forceLiveCollection },
    context,
  );
}
