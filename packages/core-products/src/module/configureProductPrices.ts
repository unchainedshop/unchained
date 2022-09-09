import { Product, ProductConfiguration, ProductsModule } from '@unchainedshop/types/products';
import crypto from 'crypto';
import { IProductPricingSheet, ProductPriceRate } from '@unchainedshop/types/products.pricing';
import { ProductPricingDirector } from '../director/ProductPricingDirector';
import { getPriceLevels } from './utils/getPriceLevels';
import { getPriceRange } from './utils/getPriceRange';
import { ProductPriceRates } from '../db/ProductPriceRates';

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
          .update([product._id, countryCode, currencyCode].join(''))
          .digest('hex'),
        ...normalizedPrice,
      };
    }
    return null;
  };

  const userPrice: ProductsModule['prices']['userPrice'] = async (
    product,
    { quantity = 1, country, currency, useNetPrice, configuration },
    requestContext,
  ) => {
    const user = await requestContext.modules.users.findUserById(requestContext.userId);
    const pricingDirector = await ProductPricingDirector.actions(
      {
        product,
        user,
        country,
        currency,
        quantity,
        configuration,
      },
      requestContext,
    );

    const calculated = await pricingDirector.calculate();
    if (!calculated || !calculated.length) return null;

    const pricing = pricingDirector.calculationSheet() as IProductPricingSheet;
    const unitPrice = pricing.unitPrice({ useNetPrice });

    return {
      _id: crypto
        .createHash('sha256')
        .update([product._id, country, quantity, useNetPrice, user ? user._id : 'ANONYMOUS'].join(''))
        .digest('hex'),
      ...unitPrice,
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
      { country, currency, includeInactive = false, quantity, useNetPrice = false, vectors = [] },
      requestContext,
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
                useNetPrice,
              },
              requestContext,
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
              { baseCurrency, quoteCurrency },
              {
                baseCurrency: quoteCurrency,
                quoteCurrency: baseCurrency,
              },
            ],
            timestamp: { $lte: referenceDate },
            expiresAt: { $gte: referenceDate },
          },
          { sort: { timestamp: -1 } },
        );
        let rate = null;

        if (!mostRecentCurrencyRate) return null;

        if (mostRecentCurrencyRate.baseCurrency === baseCurrency) {
          rate = mostRecentCurrencyRate.rate;
        } else {
          rate = 1 / mostRecentCurrencyRate.rate;
        }

        return rate;
      },
      updateRate: async (rate) => {
        const priceRates = await ProductPriceRates(db);
        try {
          await priceRates.ProductRates.insertOne(rate);
          return true;
        } catch (e) {
          return false;
        }
      },
      updateRates: async (rates) => {
        const priceRates = await ProductPriceRates(db);
        try {
          if (rates?.length) {
            const BulkOp = priceRates.ProductRates.initializeUnorderedBulkOp();
            rates.forEach((rate) => {
              BulkOp.find({
                baseCurrency: rate.baseCurrency,
                quoteCurrency: rate.quoteCurrency,
                rate: rate.rate,
                expiresAt: { $gte: rate.timestamp },
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

              // Expire the others that were still valid
              BulkOp.find({
                baseCurrency: rate.baseCurrency,
                quoteCurrency: rate.quoteCurrency,
                expiresAt: { $gte: rate.timestamp, $lt: rate.expiresAt },
              }).update({
                $set: {
                  expiresAt: rate.timestamp,
                },
              });
            });
            await BulkOp.execute();
          }
          return true;
        } catch (e) {
          return false;
        }
      },
    },
  };
};
