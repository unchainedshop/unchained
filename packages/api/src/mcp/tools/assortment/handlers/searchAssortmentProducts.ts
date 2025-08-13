import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function searchAssortmentProducts(
  context: Context,
  params: Params<'SEARCH_PRODUCTS'>,
) {
  const { modules, services } = context;
  const { assortmentId, queryString, limit = 50, offset = 0, includeInactive = false } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const productIds = await modules.assortments.findProductIds({
    assortmentId,
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
  return { products: products_normalized };
}
