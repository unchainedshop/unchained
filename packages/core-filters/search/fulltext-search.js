import { ProductTexts } from 'meteor/unchained:core-products';

export default async ({ queryString, includeInactive, orderBy }) => {
  const productIds = ProductTexts.find( { $text: { $search: queryString } } , {
    fields: {
      productId: 1
    }
  }).map(({ productId }) => productId)
  return {
    productIds,
    filterIds: [],
    selector: {}
  };
}
