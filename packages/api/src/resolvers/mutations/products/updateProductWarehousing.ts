import { log } from '@unchainedshop/logger';
import { ProductTypes } from 'meteor/unchained:core-products';
import { Context, Root } from '@unchainedshop/types/api';

import { ProductWarehousing } from '@unchainedshop/types/products';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors';

export default async function updateProductWarehousing(
  root: Root,
  { warehousing, productId }: { warehousing: ProductWarehousing; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductWarehousing ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product?.type !== ProductTypes.SimpleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.SimpleProduct,
    });

  await modules.products.update(productId, { warehousing }, userId);

  return modules.products.findProduct({ productId });
}
