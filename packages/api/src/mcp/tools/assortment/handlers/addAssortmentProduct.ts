import { Context } from '../../../../context.js';
import { AssortmentNotFoundError, ProductNotFoundError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function addAssortmentProduct(context: Context, params: Params<'ADD_PRODUCT'>) {
  const { modules } = context;
  const { assortmentId, productId, tags } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const assortmentProduct = await modules.assortments.products.create({
    assortmentId,
    productId,
    tags,
  } as any);
  const detail = await getNormalizedProductDetails(assortmentProduct.productId, context);
  return { product: { ...detail, ...assortmentProduct } };
}
