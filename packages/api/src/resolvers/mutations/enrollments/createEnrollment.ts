import { log } from '@unchainedshop/logger';
import { EnrollmentDirector } from '@unchainedshop/core';
import type { Context } from '../../../context.ts';
import { ProductStatus, ProductType } from '@unchainedshop/core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
  ProductWrongTypeError,
  EnrollmentPlanNotSupportedError,
} from '../../../errors.ts';

export default async function createEnrollment(
  root: never,
  { contact, plan, billingAddress, payment, delivery, meta },
  context: Context,
) {
  const { countryCode, currencyCode, modules, services, userId } = context;

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

  if (product.type !== ProductType.PLAN_PRODUCT) throw new ProductWrongTypeError({ type: product.type });

  // Ensure a registered enrollment plugin supports this plan before we persist anything,
  // so an unsupported plan configuration fails cleanly instead of leaving an orphaned enrollment.
  if (!EnrollmentDirector.findSupportedAdapter(product.plan)) {
    throw new EnrollmentPlanNotSupportedError({ productId });
  }

  const enrollment = await modules.enrollments.create({
    billingAddress,
    configuration,
    contact,
    countryCode,
    currencyCode,
    delivery,
    meta,
    payment,
    productId,
    quantity,
    userId: userId!,
  });

  try {
    return await services.enrollments.initializeEnrollment(enrollment, {
      orderIdForFirstPeriod: enrollment.orderIdForFirstPeriod,
      reason: 'new_enrollment',
    });
  } catch (e) {
    // Roll back the just-created enrollment so a failed initialization can't leave an orphan behind.
    await modules.enrollments.delete(enrollment._id);
    throw e;
  }
}
