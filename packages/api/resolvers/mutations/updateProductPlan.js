import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongStatusError,
} from '../../errors';

export default function updateProductPlan(
  root,
  { plan, productId },
  { userId }
) {
  log(`mutation updateProductPlan ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const productObject = Products.findProduct({ productId });
  if (!productObject) throw new ProductNotFoundError({ productId });
  if (productObject?.type !== ProductTypes.PlanProduct)
    throw new ProductWrongStatusError({
      received: productObject?.type,
      required: ProductTypes.PlanProduct,
    });
  Products.updateProduct({ productId, plan });
  return Products.findProduct({ productId });
}
