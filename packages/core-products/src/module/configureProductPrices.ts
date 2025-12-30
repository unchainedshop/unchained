/**
 * Product Prices Module - Drizzle ORM with SQLite/Turso
 */

import { eq, and, or, lte, gte, desc, sql, generateId, type DrizzleDb } from '@unchainedshop/store';
import { getPriceLevels } from './utils/getPriceLevels.ts';
import { getPriceRange } from './utils/getPriceRange.ts';
import {
  productRates,
  type ProductRateRow,
  type ProductRow,
  type ProductConfiguration,
  type ProductPrice,
} from '../db/index.ts';

export type ProductPriceRate = ProductRateRow;

export interface ProductPriceRange {
  minPrice: ProductPrice;
  maxPrice: ProductPrice;
}

export const getDecimals = (originDecimals?: number | null) => {
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
  let rate: number | null = null;
  if (rateRecord.quoteCurrency === quoteCurrency.isoCode) {
    rate = rateRecord.rate;
  } else {
    rate = 1 / rateRecord.rate;
  }
  const fromDecimals = getDecimals(baseCurrency.decimals);
  const targetDecimals = getDecimals(quoteCurrency.decimals);
  rate = fromDecimals !== targetDecimals ? rate / 10 ** (fromDecimals - targetDecimals) : rate;
  return rate;
};

export const configureProductPricesModule = ({
  proxyProducts,
  db,
}: {
  proxyProducts: (
    product: ProductRow,
    vectors: ProductConfiguration[],
    options: { includeInactive?: boolean },
  ) => Promise<ProductRow[]>;
  db: DrizzleDb;
}) => {
  const catalogPrice = async (
    product: ProductRow,
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

    const foundPrice = pricing.find((level) => !level.maxQuantity || level.maxQuantity >= quantity);
    if (!foundPrice) return null;

    const normalizedPrice = {
      isTaxable: false,
      isNetPrice: false,
      ...foundPrice,
    };

    if (normalizedPrice.amount !== null) {
      return normalizedPrice;
    }
    return null;
  };

  return {
    price: catalogPrice,

    priceRange: getPriceRange,

    async catalogPrices(product: ProductRow): Promise<ProductPrice[]> {
      return (product.commerce && product.commerce.pricing) || [];
    },

    catalogPriceRange: async (
      product: ProductRow,
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
      product: ProductRow,
      { currencyCode, countryCode }: { currencyCode: string; countryCode: string },
    ): Promise<
      {
        minQuantity: number;
        maxQuantity: number;
        price: ProductPrice;
      }[]
    > => {
      let previousMax: number | undefined;

      const filteredAndSortedPriceLevels = getPriceLevels({
        product,
        currencyCode,
        countryCode,
      });

      return filteredAndSortedPriceLevels.map((priceLevel, i) => {
        const max = priceLevel.maxQuantity || 0;
        const min = previousMax ? previousMax + 1 : 0;
        previousMax = priceLevel.maxQuantity;

        return {
          minQuantity: min,
          maxQuantity:
            i === 0 && priceLevel.maxQuantity && priceLevel.maxQuantity > 0
              ? priceLevel.maxQuantity
              : max,
          price: {
            isTaxable: !!priceLevel.isTaxable,
            isNetPrice: !!priceLevel.isNetPrice,
            amount: priceLevel.amount,
            currencyCode,
            countryCode,
          },
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
      ): Promise<{ rate: number; expiresAt?: Date | null } | null> => {
        const [mostRecentCurrencyRate] = await db
          .select()
          .from(productRates)
          .where(
            and(
              or(
                and(
                  eq(productRates.baseCurrency, baseCurrency.isoCode),
                  eq(productRates.quoteCurrency, quoteCurrency.isoCode),
                ),
                and(
                  eq(productRates.baseCurrency, quoteCurrency.isoCode),
                  eq(productRates.quoteCurrency, baseCurrency.isoCode),
                ),
              ),
              lte(productRates.timestamp, referenceDate),
              gte(productRates.expiresAt, referenceDate),
            ),
          )
          .orderBy(desc(productRates.timestamp))
          .limit(1);

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
        const rates = await db
          .select()
          .from(productRates)
          .where(
            and(
              or(
                and(
                  eq(productRates.baseCurrency, baseCurrency.isoCode),
                  eq(productRates.quoteCurrency, quoteCurrency.isoCode),
                ),
                and(
                  eq(productRates.baseCurrency, quoteCurrency.isoCode),
                  eq(productRates.quoteCurrency, baseCurrency.isoCode),
                ),
              ),
              lte(productRates.timestamp, referenceDate),
              gte(productRates.expiresAt, referenceDate),
            ),
          );

        if (rates.length === 0) return null;

        return rates.reduce(
          (acc, rateRecord) => {
            const curRate = normalizeRate(baseCurrency, quoteCurrency, rateRecord);
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

      updateRates: async (
        rates: {
          baseCurrency: string;
          quoteCurrency: string;
          rate: number;
          expiresAt?: Date;
          timestamp?: Date;
        }[],
      ): Promise<boolean> => {
        try {
          if (rates?.length) {
            for (const rate of rates) {
              // Try to find an existing rate to update
              const [existing] = await db
                .select()
                .from(productRates)
                .where(
                  and(
                    eq(productRates.baseCurrency, rate.baseCurrency),
                    eq(productRates.quoteCurrency, rate.quoteCurrency),
                    sql`${productRates.rate} = ${rate.rate}`,
                    gte(productRates.expiresAt, rate.timestamp || new Date()),
                  ),
                )
                .limit(1);

              if (existing) {
                // Update expiresAt
                await db
                  .update(productRates)
                  .set({ expiresAt: rate.expiresAt })
                  .where(eq(productRates._id, existing._id));
              } else {
                // Insert new rate
                await db.insert(productRates).values({
                  _id: generateId(),
                  baseCurrency: rate.baseCurrency,
                  quoteCurrency: rate.quoteCurrency,
                  rate: rate.rate,
                  timestamp: rate.timestamp || new Date(),
                  expiresAt: rate.expiresAt,
                });
              }
            }
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
