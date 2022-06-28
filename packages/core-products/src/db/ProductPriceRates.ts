import { ProductPriceRate } from '@unchainedshop/types/products.pricing';
import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from '@unchainedshop/utils';

export const ProductPriceRates = async (db: Db) => {
  const ProductRates = db.collection<ProductPriceRate>('product_rates');
  // ProductRates Indexes
  await buildDbIndexes(ProductRates, [
    { index: { baseCurrency: 1 } },
    { index: { quoteCurrency: 1 } },
    { index: { timestamp: 1 } },
  ]);

  return {
    ProductRates,
  };
};
