import crypto from 'crypto';
import { Product, ProductConfiguration, ProductPriceRate } from '../types.js';
import { ProductPricingDirector } from '../director/ProductPricingDirector.js';
import { getPriceLevels } from './utils/getPriceLevels.js';
import { getPriceRange } from './utils/getPriceRange.js';
import { ProductPriceRates } from '../db/ProductPriceRates.js';
import { ProductsModule } from '../products-index.js';
import type { Currency } from '@unchainedshop/core-currencies';

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
  baseCurrency: Currency,
  quoteCurrency: Currency,
  rateRecord: ProductPriceRate,
) => {
  let rate = null;
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
    product: Product,
    vectors: Array<ProductConfiguration>,
    options: { includeInactive?: boolean },
  ) => Promise<Array<Product>>;
  db: any;
}): ProductsModule['prices'] => {
  const catalogPrice: ProductsModule['prices']['price'] = async (
    product,
    { country: countryCode, currency: currencyCode, quantity = 1 },
  ) => {
    const pricing = getPriceLevels({
      product,
      currencyCode,
      countryCode,
    });

    const foundPrice = pricing.find((level) => !level.maxQuantity || level.maxQuantity >= quantity);

    const normalizedPrice = {
      amount: null,
      currencyCode,
      countryCode,
      isTaxable: false,
      isNetPrice: false,
      ...foundPrice,
    };

    if (normalizedPrice.amount !== undefined && normalizedPrice.amount !== null) {
      return {
        _id: crypto
          .createHash('sha256')
          .update([product._id, normalizedPrice.countryCode, normalizedPrice.currencyCode].join(''))
          .digest('hex'),
        ...normalizedPrice,
      };
    }
    return null;
  };

  const userPrice: ProductsModule['prices']['userPrice'] = async (
    product,
    { quantity = 1, country, currency, useNetPrice, userId, configuration },
    unchainedAPI,
  ) => {
    const user = await unchainedAPI.modules.users.findUserById(userId);

    const pricingContext = {
      product,
      user,
      country,
      currency,
      quantity,
      configuration,
    };

    const calculated = await ProductPricingDirector.rebuildCalculation(pricingContext, unchainedAPI);

    if (!calculated || !calculated.length) return null;

    const pricing = ProductPricingDirector.calculationSheet(pricingContext, calculated);
    const unitPrice = pricing.unitPrice({ useNetPrice });

    return {
      _id: crypto
        .createHash('sha256')
        .update([product._id, country, quantity, useNetPrice, user ? user._id : 'ANONYMOUS'].join(''))
        .digest('hex'),
      ...unitPrice,
      isNetPrice: useNetPrice,
      isTaxable: pricing.taxSum() > 0,
      currencyCode: pricing.currency,
    };
  };

  return {
    price: catalogPrice,
    userPrice,

    catalogPrices: (product) => {
      const prices = (product.commerce && product.commerce.pricing) || [];
      return prices.map((price) => ({
        _id: crypto
          .createHash('sha256')
          .update(
            [product._id, price.countryCode, price.currencyCode, price.maxQuantity, price.amount].join(
              '',
            ),
          )
          .digest('hex'),
        ...price,
      }));
    },

    catalogPriceRange: async (
      product,
      { quantity = 0, vectors = [], includeInactive = false, country, currency },
    ) => {
      const products = await proxyProducts(product, vectors, {
        includeInactive,
      });

      const filteredPrices = (
        await Promise.all(
          products.map((proxyProduct) =>
            catalogPrice(proxyProduct, {
              country,
              quantity,
              currency,
            }),
          ),
        )
      ).filter(Boolean);

      if (!filteredPrices.length) return null;

      const { minPrice, maxPrice } = getPriceRange({
        productId: product._id as string,
        prices: filteredPrices,
      });

      return {
        _id: crypto
          .createHash('sha256')
          .update(
            [
              product._id,
              Math.random(),
              minPrice.amount,
              minPrice.currencyCode,
              maxPrice.amount,
              maxPrice.currencyCode,
            ].join(''),
          )
          .digest('hex'),
        minPrice,
        maxPrice,
      };
    },

    simulatedPriceRange: async (
      product,
      {
        userId,
        country,
        currency,
        includeInactive = false,
        quantity,
        useNetPrice = false,
        vectors = [],
      },
      unchainedAPI,
    ) => {
      const products = await proxyProducts(product, vectors, {
        includeInactive,
      });

      const filteredPrices = (
        await Promise.all(
          products.map((proxyProduct) =>
            userPrice(
              proxyProduct,
              {
                quantity,
                currency,
                country,
                userId,
                useNetPrice,
              },
              unchainedAPI,
            ),
          ),
        )
      ).filter(Boolean);

      if (!filteredPrices.length) return null;

      const { minPrice, maxPrice } = getPriceRange({
        productId: product._id as string,
        prices: filteredPrices,
      });

      return {
        _id: crypto
          .createHash('sha256')
          .update(
            [
              product._id,
              Math.random(),
              minPrice.amount,
              minPrice.currencyCode,
              maxPrice.amount,
              maxPrice.currencyCode,
            ].join(''),
          )
          .digest('hex'),
        minPrice,
        maxPrice,
      };
    },

    catalogPricesLeveled: async (product, { currency: currencyCode, country: countryCode }) => {
      let previousMax = null;

      const filteredAndSortedPriceLevels = getPriceLevels({
        product,
        currencyCode,
        countryCode,
      });

      return filteredAndSortedPriceLevels.map((priceLevel, i) => {
        const max = priceLevel.maxQuantity || null;
        const min = previousMax ? previousMax + 1 : 0;
        previousMax = priceLevel.maxQuantity;

        return {
          minQuantity: min,
          maxQuantity: i === 0 && priceLevel.maxQuantity > 0 ? priceLevel.maxQuantity : max,
          price: {
            _id: crypto
              .createHash('sha256')
              .update([product._id, priceLevel.amount, currencyCode].join(''))
              .digest('hex'),
            isTaxable: !!priceLevel.isTaxable,
            isNetPrice: !!priceLevel.isNetPrice,
            amount: priceLevel.amount,
            currencyCode,
          },
        };
      });
    },

    rates: {
      getRate: async (baseCurrency, quoteCurrency, referenceDate = new Date()) => {
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
      getRateRange: async (baseCurrency, quoteCurrency, referenceDate = new Date()) => {
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
      updateRates: async (rates) => {
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
