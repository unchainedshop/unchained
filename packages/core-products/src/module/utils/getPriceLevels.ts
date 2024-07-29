import { Product } from '../../types.js';

export const getPriceLevels = (params: {
  product?: Product;
  currencyCode?: string;
  countryCode: string;
}) => {
  return (params.product?.commerce?.pricing || [])
    .sort(({ maxQuantity: leftMaxQuantity = 0 }, { maxQuantity: rightMaxQuantity = 0 }) => {
      if (leftMaxQuantity === rightMaxQuantity || (!leftMaxQuantity && !rightMaxQuantity)) return 0;
      if (leftMaxQuantity === 0) return 1;
      if (rightMaxQuantity === 0) return -1;
      return leftMaxQuantity - rightMaxQuantity;
    })
    .filter((priceLevel) => {
      if (!params.currencyCode) return priceLevel.countryCode === params.countryCode;
      return (
        priceLevel.currencyCode === params.currencyCode && priceLevel.countryCode === params.countryCode
      );
    });
};
