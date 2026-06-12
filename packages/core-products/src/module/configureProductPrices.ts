import { getPriceLevels } from './utils/getPriceLevels.ts';
import { getPriceRange } from './utils/getPriceRange.ts';
import { type ProductPriceRate, ProductPriceRates } from '../db/ProductPriceRates.ts';
import {
  type Product,
  type ProductConfiguration,
  type ProductPrice,
  type ProductPriceRange,
} from '../db/ProductsCollection.ts';

export const getDecimals = (originDecimals) => {
  if (originDecimals === null || originDecimals === undefined) {
    return 2;
  }
  if (originDecimals > 2) {
    // cryptocurrency, always stored in MAX. 9 decimals
    // WORKAROUND FOR BIGINT PROBLEM!
    return Math.min(originDecimals, 9);
  }
  return originDecimals;
};

export const normalizeRate = (
  baseCurrency: {
    decimals?: number;
    isoCode: string;
  },
  quoteCurrency: {
    decimals?: number;
    isoCode: string;
  },
  rateRecord: ProductPriceRate,
) => {
  let rate = rateRecord.quoteCurrency === quoteCurrency.isoCode ? rateRecord.rate : 1 / rateRecord.rate;
  const fromDecimals = getDecimals(baseCurrency.decimals);
  const targetDecimals = getDecimals(quoteCurrency.decimals);
  rate = fromDecimals !== targetDecimals ? rate / 10 ** (fromDecimals - targetDecimals) : rate;
  return rate;
};

const normalizeProductPrice = (priceLevel: ProductPrice): ProductPrice | null => {
  if (priceLevel.amount === null) return null;

  return {
    amount: priceLevel.amount,
    currencyCode: priceLevel.currencyCode,
    countryCode: priceLevel.countryCode,
    minQuantity: priceLevel.minQuantity ?? 0,
    isTaxable: !!priceLevel.isTaxable,
    isNetPrice: !!priceLevel.isNetPrice,
  };
};

export const configureProductPricesModule = ({
  proxyProducts,
  db,
}: {
  proxyProducts: (
    product: Product,
    vectors: ProductConfiguration[],
    options: { includeInactive?: boolean },
  ) => Promise<Product[]>;
  db: any;
}) => {
  const catalogPrice = async (
    product: Product,
    {
      countryCode,
      currencyCode,
      quantity = 1,
    }: { countryCode: string; currencyCode?: string; quantity?: number },
  ): Promise<ProductPrice | null> => {
    const pricing = getPriceLevels({
      product,
      currencyCode,
      countryCode,
    });

    // Tiers are sorted ascending by minQuantity; the applicable tier is the
    // highest floor that is <= quantity. The base tier has minQuantity 0, so the
    // default quantity 0 used by price-range queries resolves to it. Legacy
    // data without a floor is treated as the base tier until it is migrated.
    const foundPrice = pricing.filter((level) => (level.minQuantity ?? 0) <= quantity).pop();
    if (!foundPrice) return null;

    return normalizeProductPrice(foundPrice);
  };

  return {
    price: catalogPrice,

    priceRange: getPriceRange,

    async catalogPrices(product: Product): Promise<ProductPrice[]> {
      return ((product.commerce && product.commerce.pricing) || [])
        .map(normalizeProductPrice)
        .filter((priceLevel): priceLevel is ProductPrice => Boolean(priceLevel));
    },

    catalogPriceRange: async (
      product: Product,
      {
        quantity = 0,
        vectors = [],
        includeInactive = false,
        countryCode,
        currencyCode,
      }: {
        countryCode: string;
        currencyCode: string;
        includeInactive?: boolean;
        quantity?: number;
        vectors: ProductConfiguration[];
      },
    ): Promise<ProductPriceRange | null> => {
      const products = await proxyProducts(product, vectors, {
        includeInactive,
      });

      const filteredPrices = (
        await Promise.all(
          products.map((proxyProduct) =>
            catalogPrice(proxyProduct, {
              countryCode,
              quantity,
              currencyCode,
            }),
          ),
        )
      ).filter(Boolean) as ProductPrice[];

      if (!filteredPrices.length) return null;

      const { minPrice, maxPrice } = getPriceRange({
        productId: product._id as string,
        prices: filteredPrices,
      });

      return {
        minPrice,
        maxPrice,
      };
    },

    catalogPricesLeveled: async (
      product: Product,
      { currencyCode, countryCode }: { currencyCode: string; countryCode: string },
    ): Promise<
      {
        minQuantity: number;
        maxQuantity: number | null;
        price: ProductPrice;
      }[]
    > => {
      const sortedPriceLevels = getPriceLevels({
        product,
        currencyCode,
        countryCode,
      });

      return sortedPriceLevels.flatMap((priceLevel, i) => {
        const nextLevel = sortedPriceLevels[i + 1];
        const price = normalizeProductPrice({
          ...priceLevel,
          currencyCode,
          countryCode,
        });
        if (!price) return [];

        // Present each tier as [minQuantity .. maxQuantity]. The upper bound is
        // derived from the next tier's floor; the highest tier is open-ended (null).
        return {
          minQuantity: priceLevel.minQuantity ?? 0,
          maxQuantity: nextLevel?.minQuantity != null ? nextLevel.minQuantity - 1 : null,
          price,
        };
      });
    },

    rates: {
      getRate: async (
        baseCurrency: {
          isoCode: string;
          decimals?: number;
        },
        quoteCurrency: {
          isoCode: string;
          decimals?: number;
        },
        referenceDate: Date = new Date(),
      ): Promise<{ rate: number; expiresAt?: Date } | null> => {
        const priceRates = await (await ProductPriceRates(db)).ProductRates;
        const mostRecentCurrencyRate = await priceRates.findOne(
          {
            $or: [
              {
                baseCurrency: baseCurrency.isoCode,
                quoteCurrency: quoteCurrency.isoCode,
              },
              {
                baseCurrency: quoteCurrency.isoCode,
                quoteCurrency: baseCurrency.isoCode,
              },
            ],
            timestamp: { $lte: referenceDate },
            expiresAt: { $gte: referenceDate },
          },
          { sort: { timestamp: -1 } },
        );

        if (!mostRecentCurrencyRate) return null;
        const rate = normalizeRate(baseCurrency, quoteCurrency, mostRecentCurrencyRate);
        return { rate, expiresAt: mostRecentCurrencyRate.expiresAt };
      },
      getRateRange: async (
        baseCurrency: {
          isoCode: string;
          decimals?: number;
        },
        quoteCurrency: {
          isoCode: string;
          decimals?: number;
        },
        referenceDate: Date = new Date(),
      ): Promise<{ min: number; max: number } | null> => {
        const priceRates = await (await ProductPriceRates(db)).ProductRates;
        const rates = await priceRates
          .find({
            $or: [
              {
                baseCurrency: baseCurrency.isoCode,
                quoteCurrency: quoteCurrency.isoCode,
              },
              {
                baseCurrency: quoteCurrency.isoCode,
                quoteCurrency: baseCurrency.isoCode,
              },
            ],
            timestamp: { $lte: referenceDate },
            expiresAt: { $gte: referenceDate },
          })
          .toArray();
        return rates.reduce(
          (acc, rate) => {
            const curRate = normalizeRate(baseCurrency, quoteCurrency, rate);
            const lastMinRate = acc.min || curRate;
            const lastMaxRate = acc.max || curRate;
            return {
              min: Math.min(curRate, lastMinRate),
              max: Math.max(curRate, lastMaxRate),
            };
          },
          {} as { min: number; max: number },
        );
      },
      updateRates: async (rates: ProductPriceRate[]): Promise<boolean> => {
        const priceRates = await ProductPriceRates(db);
        try {
          if (rates?.length) {
            const BulkOp = priceRates.ProductRates.initializeOrderedBulkOp();
            rates.forEach((rate) => {
              BulkOp.find({
                baseCurrency: rate.baseCurrency,
                quoteCurrency: rate.quoteCurrency,
                rate: rate.rate,
                expiresAt: { $gte: rate.timestamp },
                archived: false,
              })
                .upsert()
                .updateOne({
                  $set: {
                    expiresAt: rate.expiresAt,
                  },
                  $setOnInsert: {
                    baseCurrency: rate.baseCurrency,
                    quoteCurrency: rate.quoteCurrency,
                    timestamp: rate.timestamp,
                    rate: rate.rate,
                  },
                });

              // Archive the others that were still valid
              BulkOp.find({
                baseCurrency: rate.baseCurrency,
                quoteCurrency: rate.quoteCurrency,
                expiresAt: { $gte: rate.timestamp, $lt: rate.expiresAt },
              }).update({
                $set: {
                  archived: true,
                },
              });
            });
            await BulkOp.execute();
          }
          return true;
        } catch {
          return false;
        }
      },
    },
  };
};

export type ProductPricesModule = ReturnType<typeof configureProductPricesModule>;
