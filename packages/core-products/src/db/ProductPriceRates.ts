import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';

export interface ProductPriceRate {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  expiresAt?: Date;
  timestamp?: Date;
}

export const ProductPriceRates = async (db: mongodb.Db) => {
  const ProductRates = db.collection<ProductPriceRate>('product_rates');

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
