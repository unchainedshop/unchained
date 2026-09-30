import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { type ProductTokenization, ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError, ProductWrongStatusError } from '../../../errors.ts';

export default async function updateProductTokenization(
  root: never,
  { tokenization, productId }: { tokenization: ProductTokenization; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductTokenization ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product?.type !== ProductType.TOKENIZED_PRODUCT)
    throw new ProductWrongStatusError({
      received: product?.type,
      required: ProductType.TOKENIZED_PRODUCT,
    });

  await modules.products.update(productId, { tokenization });

  return modules.products.findProduct({ productId });
}
