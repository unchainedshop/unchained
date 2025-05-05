import { ProductPrice } from '../../db/ProductsCollection.js';

export const getPriceRange = (params: {
  productId: string;
  prices: ProductPrice[];
}): { minPrice: ProductPrice; maxPrice: ProductPrice } => {
  const { min, max } = params.prices.reduce(
    (m, current) => {
      return {
        min: current.amount < m.min.amount ? current : m.min,
        max: current.amount > m.max.amount ? current : m.max,
      };
    },
    {
      min: { ...params.prices[0] },
      max: { ...params.prices[0] },
    },
  );

  return {
    minPrice: {
      isTaxable: !!min?.isTaxable,
      isNetPrice: !!min?.isNetPrice,
      amount: Math.round(min?.amount),
      currencyCode: min?.currencyCode,
    },
    maxPrice: {
      isTaxable: !!max?.isTaxable,
      isNetPrice: !!max?.isNetPrice,
      amount: Math.round(max?.amount),
      currencyCode: max?.currencyCode,
    },
  };
};
