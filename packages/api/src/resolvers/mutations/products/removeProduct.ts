import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductLinkedToActiveVariationError,
  ProductLinkedToActiveBundleError,
  ProductLinkedToEnrollmentError,
  ProductLinkedToQuotationError,
} from '../../../errors.js';

export default async function removeProduct(
  root: never,
  { productId }: { productId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`mutation removeProduct ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const activeBundle = await modules.products.firstActiveProductBundle(productId);
  if (activeBundle)
    throw new ProductLinkedToActiveBundleError({ productId, bundleId: activeBundle._id });
  const activeProxy = await modules.products.firstActiveProductProxy(productId);
  if (activeProxy)
    throw new ProductLinkedToActiveVariationError({ productId, proxyId: activeProxy._id });

  const openQuotation = await modules.quotations.openQuotationWithProduct({ productId });
  if (openQuotation)
    throw new ProductLinkedToQuotationError({ productId, quotationId: openQuotation?._id });
  const openEnrollment = await modules.enrollments.openEnrollmentWithProduct({ productId });
  if (openEnrollment)
    throw new ProductLinkedToEnrollmentError({ productId, enrollmentId: openEnrollment?._id });

  await services.products.removeProduct({ productId }, context);

  return modules.products.findProduct({ productId });
}
