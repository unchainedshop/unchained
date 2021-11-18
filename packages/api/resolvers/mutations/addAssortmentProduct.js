import { log } from 'unchained-logger';
import {
  Assortments,
  AssortmentProducts,
} from 'meteor/unchained:core-assortments';
import { Products } from 'meteor/unchained:core-products';
import {
  AssortmentNotFoundError,
  ProductNotFoundError,
  InvalidIdError,
} from '../../errors';

export default function addAssortmentProduct(
  root,
  { assortmentId, productId, ...assortmentProduct },
  { userId }
) {
  log(`mutation addAssortmentProduct ${assortmentId} -> ${productId}`, {
    userId,
  });
  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  if (!productId) throw new InvalidIdError({ productId });

  if (!Assortments.assortmentExists({ assortmentId }))
    throw new AssortmentNotFoundError({
      assortmentId,
    });

  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });

  return AssortmentProducts.createAssortmentProduct({
    assortmentId,
    productId,
    authorId: userId,
    ...assortmentProduct,
  });
}
