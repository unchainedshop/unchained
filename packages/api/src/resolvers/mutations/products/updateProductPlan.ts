import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { ProductPlan, ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError, ProductWrongStatusError } from '../../../errors.js';

export default async function updateProductPlan(
  root: never,
  { plan, productId }: { plan: ProductPlan; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductPlan ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product?.type !== ProductType.PLAN_PRODUCT)
    throw new ProductWrongStatusError({
      received: product?.type,
      required: ProductType.PLAN_PRODUCT,
    });

  await modules.products.update(productId, { plan });

  return modules.products.findProduct({ productId });
}
