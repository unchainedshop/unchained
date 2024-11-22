import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';
import { ProductPlan } from '@unchainedshop/core-products';
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

  if (product?.type !== ProductTypes.PlanProduct)
    throw new ProductWrongStatusError({
      received: product?.type,
      required: ProductTypes.PlanProduct,
    });

  await modules.products.update(productId, { plan });

  return modules.products.findProduct({ productId });
}
