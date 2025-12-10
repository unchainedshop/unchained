import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError, ProductNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function addAssortmentProduct(context: Context, params: Params<'ADD_PRODUCT'>) {
  const { modules } = context;
  const { assortmentId, productId, tags } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  await modules.assortments.products.create({
    assortmentId,
    productId,
    tags,
  } as any);

  return { assortment: await getNormalizedAssortmentDetails({ assortmentId }, context) };
}
