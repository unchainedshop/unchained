import type { Product } from '../../db/ProductsCollection.ts';

export const getPriceLevels = (params: {
  product?: Product;
  currencyCode?: string;
  countryCode: string;
}) => {
  return (params.product?.commerce?.pricing || [])
    .toSorted((a, b) => {
      const left = a.minQuantity ?? 0;
      const right = b.minQuantity ?? 0;
      return left - right;
    })
    .filter((priceLevel) => {
      if (!params.currencyCode) return priceLevel.countryCode === params.countryCode;
      return (
        priceLevel.currencyCode === params.currencyCode && priceLevel.countryCode === params.countryCode
      );
    });
};
