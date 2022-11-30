import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductTokenization } from '@unchainedshop/types/products';
import { ProductNotFoundError, InvalidIdError, ProductWrongStatusError } from '../../../errors';

export default async function updateProductTokenization(
  root: Root,
  { tokenization, productId }: { tokenization: ProductTokenization; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductTokenization ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product?.type !== ProductTypes.TokenizedProduct)
    throw new ProductWrongStatusError({
      received: product?.type,
      required: ProductTypes.TokenizedProduct,
    });

  await modules.products.update(productId, { tokenization });

  return modules.products.findProduct({ productId });
}
