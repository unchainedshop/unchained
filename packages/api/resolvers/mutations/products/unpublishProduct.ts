import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
} from '../../../errors';

export default async function unpublishProduct(
  root: Root,
  { productId }: { productId: string },
  { modules, userId }: Context
) {
  log(`mutation unpublishProduct ${productId}`,{ userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (!(await modules.products.unpublish(product, userId))) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  return await modules.products.findProduct({ productId });
}
