import { Context } from '../../../../context.js';
import {
  ProductLinkedToActiveBundleError,
  ProductLinkedToActiveVariationError,
  ProductLinkedToEnrollmentError,
  ProductLinkedToQuotationError,
  ProductNotFoundError,
} from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function removeProduct(context: Context, params: Params<'REMOVE'>) {
  const { modules, services } = context;
  const { productId } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
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

  await services.products.removeProduct({ productId });

  return { success: true };
}
