import { log } from '@unchainedshop/logger';
import { ProductTypes } from 'meteor/unchained:core-products';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductPlan } from '@unchainedshop/types/products';
import { ProductNotFoundError, InvalidIdError, ProductWrongStatusError } from '../../../errors';

export default async function updateProductPlan(
  root: Root,
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

  await modules.products.update(productId, { plan }, userId);

  return modules.products.findProduct({ productId });
}
