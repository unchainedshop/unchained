import type { Context } from '../../../../context.ts';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getVariationProducts(
  context: Context,
  params: Params<'GET_VARIATION_PRODUCTS'>,
) {
  const { modules } = context;
  const { productId, vectors, includeInactive = false } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== 'CONFIGURABLE_PRODUCT') {
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: 'CONFIGURABLE_PRODUCT',
    });
  }

  const proxyProducts = await modules.products.proxyProducts(product, vectors as any, {
    includeInactive,
  });

  return {
    products: await Promise.all(
      proxyProducts?.map(async ({ _id }) => getNormalizedProductDetails(_id, context)),
    ),
  };
}
