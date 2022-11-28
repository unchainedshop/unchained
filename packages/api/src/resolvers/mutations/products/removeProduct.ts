import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductLinkedToActiveVariationError,
  ProductLinkedToActiveBundleError,
  ProductLinkedToEnrollmentError,
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
  try {
    await services.products.removeProduct({ productId, userId: context.userId }, context);
  } catch (e) {
    if (e?.message === 'ProductLinkedToActiveVariationError')
      throw new ProductLinkedToActiveVariationError({ productId });
    if (e?.message === 'ProductLinkedToActiveVariationError')
      throw new ProductLinkedToActiveBundleError({ productId });
    if (e?.message === 'ProductLinkedToEnrollmentError')
      throw new ProductLinkedToEnrollmentError({ productId });
    throw e;
  }
  return modules.products.findProduct({ productId });
}
