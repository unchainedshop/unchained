import crypto from 'crypto';
import { ProductPrice } from '@unchainedshop/types/products.js';

export const getPriceRange = (params: {
  productId: string;
  prices: Array<ProductPrice>;
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
      _id: crypto
        .createHash('sha256')
        .update(
          [params.productId, min?.isTaxable, min?.isNetPrice, min?.amount, min?.currencyCode].join(''),
        )
        .digest('hex'),
      isTaxable: !!min?.isTaxable,
      isNetPrice: !!min?.isNetPrice,
      amount: Math.round(min?.amount),
      currencyCode: min?.currencyCode,
    },
    maxPrice: {
      _id: crypto
        .createHash('sha256')
        .update(
          [params.productId, max?.isTaxable, max?.isNetPrice, max?.amount, max?.currencyCode].join(''),
        )
        .digest('hex'),
      isTaxable: !!max?.isTaxable,
      isNetPrice: !!max?.isNetPrice,
      amount: Math.round(max?.amount),
      currencyCode: max?.currencyCode,
    },
  };
};
