import { Product } from '@unchainedshop/types/products';

export const getPriceLevels = (params: {
  product?: Product;
  currencyCode: string;
  countryCode: string;
}) => {
  return (params.product?.commerce?.pricing || [])
    .sort(({ maxQuantity: leftMaxQuantity = 0 }, { maxQuantity: rightMaxQuantity = 0 }) => {
      if (leftMaxQuantity === rightMaxQuantity || (!leftMaxQuantity && !rightMaxQuantity)) return 0;
      if (leftMaxQuantity === 0) return 1;
      if (rightMaxQuantity === 0) return -1;
      return leftMaxQuantity - rightMaxQuantity;
    })
    .filter(
      (priceLevel) =>
        priceLevel.currencyCode === params.currencyCode && priceLevel.countryCode === params.countryCode,
    );
};
