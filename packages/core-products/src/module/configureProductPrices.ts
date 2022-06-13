import { Product, ProductConfiguration, ProductsModule } from '@unchainedshop/types/products';
import crypto from 'crypto';
import { IProductPricingSheet } from '@unchainedshop/types/products.pricing';
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
    { quantity = 1, country, currency, useNetPrice },
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
      amount: unitPrice.amount,
      currencyCode: unitPrice.currency,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
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
      getRate: async (baseCurrency, quoteCurrency, maxAge) => {
        const priceRates = await (await ProductPriceRates(db)).ProductRates;
        const currencyRateBase = await priceRates.findOne({ baseCurrency, quoteCurrency });
        const currencyRateInv = await priceRates.findOne({
          baseCurrency: quoteCurrency,
          quoteCurrency: baseCurrency,
        });

        let rate = null;
        if (
          currencyRateBase &&
          (!currencyRateBase.timestamp || currencyRateBase.timestamp >= Date.now() / 1000 - maxAge)
        ) {
          rate = currencyRateBase.rate;
        } else if (
          currencyRateInv &&
          (!currencyRateInv.timestamp || currencyRateInv.timestamp >= Date.now() / 1000 - maxAge)
        ) {
          rate = 1 / currencyRateInv.rate;
        }
        return rate;
      },
      updateRate: async (rate) => {
        const priceRates = await ProductPriceRates(db);
        const { baseCurrency, quoteCurrency } = rate;
        try {
          await priceRates.ProductRates.replaceOne({ baseCurrency, quoteCurrency }, rate, {
            upsert: true,
          });
          return true;
        } catch (e) {
          return false;
        }
      },
    },
  };
};
