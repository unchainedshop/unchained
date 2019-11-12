import { ProductTexts } from 'meteor/unchained:core-products';
import defaultProductSelector from './default-product-selector';

export default async ({ queryString, includeInactive, orderBy }) => {
  const selector = defaultProductSelector({ includeInactive });

  const productIds = ProductTexts.find(
    { $text: { $search: queryString } },
    {
      fields: {
        productId: 1
      }
    }
  ).map(({ productId }) => productId);

  return {
    productIds,
    selector,
    filterIds: []
  };
};
