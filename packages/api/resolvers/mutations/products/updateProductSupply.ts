import { log } from 'meteor/unchained:logger';
import { ProductTypes } from 'meteor/unchained:core-products';
import { Context, Root } from '@unchainedshop/types/api';

import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../../errors';
import { ProductSupply } from '@unchainedshop/types/products';

export default async function updateProductSupply(
  root: Root,
  { supply, productId }: { supply: ProductSupply; productId: string },
  { modules, userId }: Context
) {
  log(`mutation updateProductSupply ${productId}`,{ userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product?.type !== ProductTypes.SimpleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product?.type,
      required: ProductTypes.SimpleProduct,
    });

  await modules.products.update(productId, { supply }, userId);

  return await modules.products.findProduct({ productId });
}
