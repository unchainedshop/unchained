import { ProductPriceRate } from '@unchainedshop/types/products.pricing.js';
import { Db } from '@unchainedshop/types/common.js';
import { buildDbIndexes } from '@unchainedshop/utils';

export const ProductPriceRates = async (db: Db) => {
  const ProductRates = db.collection<ProductPriceRate>('product_rates');
  // ProductRates Indexes
  // TODO: Time-Series Data in MongoDb 5.0!
  await buildDbIndexes(ProductRates, [
    { index: { baseCurrency: 1 } },
    { index: { quoteCurrency: 1 } },
    { index: { expiresAt: 1, timestamp: -1 } },
    { index: { expiresAt: 1 }, options: { expireAfterSeconds: 60 * 60 * 24 } },
  ]);

  return {
    ProductRates,
  };
};
