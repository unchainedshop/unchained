import type { Product } from '../../db/ProductsCollection.ts';

export const getPriceLevels = (params: {
  product?: Product;
  currencyCode?: string;
  countryCode: string;
}) => {
  return (params.product?.commerce?.pricing || [])
    // Ascending by tier floor; the highest minQuantity is the open-ended top tier.
    .toSorted((left, right) => (left.minQuantity ?? 0) - (right.minQuantity ?? 0))
    .filter((priceLevel) => {
      if (!params.currencyCode) return priceLevel.countryCode === params.countryCode;
      return (
        priceLevel.currencyCode === params.currencyCode && priceLevel.countryCode === params.countryCode
      );
    });
};
