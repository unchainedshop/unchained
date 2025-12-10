import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function searchAssortmentProducts(
  context: Context,
  params: Params<'SEARCH_PRODUCTS'>,
) {
  const { modules, services } = context;
  const { assortmentId, queryString, limit = 50, offset = 0, includeInactive = false } = params;

  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const productIds = await modules.assortments.findProductIds({
    assortment,
  });

  const filterIds = await modules.assortments.filters.findFilterIds({
    assortmentId,
  });

  const result = await services.filters.searchProducts(
    {
      queryString,
      includeInactive,
      productIds,
      filterIds,
    } as any,
    {
      locale: context.locale,
      userId: context.userId,
    },
  );

  const products = await modules.products.search.findFilteredProducts({
    limit,
    offset,
    productIds: result.aggregatedFilteredProductIds,
    productSelector: result.searchConfiguration.productSelector,
    sort: result.searchConfiguration.sortStage,
  });
  const products_normalized = await Promise.all(
    products?.map(async ({ _id }) => getNormalizedProductDetails(_id, context)) || [],
  );
  return { assortment, products: products_normalized };
}
