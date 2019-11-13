import { ProductTexts } from 'meteor/unchained:core-products';

export default ({ queryString }) => async productIdResolver => {
  // TODO: Hand of logic to Filter Plugin

  if (!queryString) return productIdResolver;

  const selector = {
    $text: { $search: queryString }
  };

  const allProductIds = await productIdResolver;
  if (allProductIds && allProductIds.length > 0) {
    selector.productId = { $in: allProductIds };
  }

  const productIds = ProductTexts.find(selector, {
    fields: {
      productId: 1
    }
  }).map(({ productId }) => productId);

  return productIds;
};
