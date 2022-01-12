import { Products } from 'meteor/unchained:core-products';

export default async function removeProduct(payload, { logger }) {
  const { _id } = payload;
  logger.debug('remove product');
  
  // Use service services.product.removeProduct
  Products.removeProduct({ productId: _id });
}
