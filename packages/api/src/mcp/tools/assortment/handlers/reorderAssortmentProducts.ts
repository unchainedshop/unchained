import type { Context } from '../../../../context.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function reorderAssortmentProducts(
  context: Context,
  params: Params<'REORDER_PRODUCTS'>,
) {
  const { modules } = context;
  const { sortKeys } = params;

  const reorderedProducts = await modules.assortments.products.updateManualOrder({
    sortKeys: sortKeys as any,
  });
  const products = await Promise.all(
    reorderedProducts?.map(async ({ productId, ...rest }) => ({
      ...(await getNormalizedProductDetails(productId, context)),
      ...rest,
    })) || [],
  );
  return { products };
}
