import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductStatus } from 'meteor/unchained:core-products';
import { ProductNotFoundError, ProductWrongStatusError, InvalidIdError } from '../../../errors';

export default async function createEnrollment(
  root: Root,
  { contact, plan, billingAddress, payment, delivery, meta },
  context: Context,
) {
  const { countryContext, modules, userId } = context;

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

  return modules.enrollments.create(
    {
      billingAddress,
      configuration,
      contact,
      countryCode: countryContext,
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
