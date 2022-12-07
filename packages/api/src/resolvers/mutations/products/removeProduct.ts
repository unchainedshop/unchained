import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductLinkedToActiveVariationError,
  ProductLinkedToActiveBundleError,
  ProductLinkedToEnrollmentError,
  ProductLinkedToQuotationError,
} from '../../../errors';

export default async function removeProduct(
  root: Root,
  { productId }: { productId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`mutation removeProduct ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const activeLink = await modules.products.firstActiveProductLink(productId);
  if (activeLink?.bundles?.length)
    throw new ProductLinkedToActiveBundleError({ productId, bundleId: activeLink?._id });
  if (activeLink?.variations?.length)
    throw new ProductLinkedToActiveVariationError({ productId, proxyId: activeLink?._id });

  const openQuotation = await modules.quotations.openQuotationWithProduct({ productId });
  if (openQuotation)
    throw new ProductLinkedToQuotationError({ productId, quotationId: openQuotation?._id });
  const openEnrollment = await modules.enrollments.openEnrollmentsWithProduct({ productId });
  if (openEnrollment)
    throw new ProductLinkedToEnrollmentError({ productId, enrollmentId: openEnrollment?._id });

  await services.products.removeProduct({ productId }, context);

  return modules.products.findProduct({ productId });
}
