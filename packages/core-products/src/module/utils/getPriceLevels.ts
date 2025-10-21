import { Product } from '../../db/ProductsCollection.js';

export const getPriceLevels = (params: {
  product?: Product;
  currencyCode?: string;
  countryCode: string;
}) => {
  return (params.product?.commerce?.pricing || [])
    .toSorted(({ maxQuantity: leftMaxQuantity = 0 }, { maxQuantity: rightMaxQuantity = 0 }) => {
      if (leftMaxQuantity === rightMaxQuantity || (!leftMaxQuantity && !rightMaxQuantity)) return 0;
      if (!leftMaxQuantity) return 1;
      if (!rightMaxQuantity) return -1;
      return leftMaxQuantity - rightMaxQuantity;
    })
    .filter((priceLevel) => {
      if (!params.currencyCode) return priceLevel.countryCode === params.countryCode;
      return (
        priceLevel.currencyCode === params.currencyCode && priceLevel.countryCode === params.countryCode
      );
    });
};
