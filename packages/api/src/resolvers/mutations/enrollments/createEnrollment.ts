import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { ProductStatus, ProductTypes } from '@unchainedshop/core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../../errors.js';

export default async function createEnrollment(
  root: never,
  { contact, plan, billingAddress, payment, delivery, meta },
  context: Context,
) {
  const { countryContext, currencyContext, modules, userId } = context;

  log('mutation createEnrollment', { userId });

  const { configuration, quantity, productId } = plan;

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) {
    throw new ProductNotFoundError({
      productId: plan.productId,
    });
  }

  if (product.status !== ProductStatus.ACTIVE) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  if (product.type !== ProductTypes.PlanProduct) throw new ProductWrongTypeError({ type: product.type });

  return modules.enrollments.create(
    {
      billingAddress,
      configuration,
      contact,
      countryCode: countryContext,
      currencyCode: currencyContext,
      delivery,
      meta,
      payment,
      productId,
      quantity,
      userId,
    },
    context,
  );
}
