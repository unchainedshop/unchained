import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { ProductNotFoundError, InvalidIdError } from '../../../errors';
import { ProductCommerce } from '@unchainedshop/types/products';

export default async function updateProductCommerce(
  root: Root,
  { commerce, productId }: { commerce: ProductCommerce; productId: string },
  { modules, userId }: Context
) {
  log(`mutation updateProductCommerce ${productId}`,{ userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  await modules.products.update(productId, { commerce }, userId);

  return await modules.products.findProduct({ productId });
}
