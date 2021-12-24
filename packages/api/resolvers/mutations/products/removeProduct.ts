import { log } from 'meteor/unchained:logger';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
} from '../../../errors';
import { Context, Root } from '@unchainedshop/types/api';

export default async function removeProduct(
  root: Root,
  { productId }: { productId: string },
  { modules, userId }: Context
) {
  log(`mutation removeProduct ${productId}`,{ userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (!modules.products.isDraft(product))
    throw new ProductWrongStatusError({ status: product.status });

  await modules.assortments.products.delete(productId as string, {}, userId);
  await modules.products.delete(productId, userId);

  return await modules.products.findProduct({ productId });
}
