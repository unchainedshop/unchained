import { Product, ProductConfiguration, ProductsModule } from '@unchainedshop/types/products';
import crypto from 'crypto';
import { ProductPricingDirector } from '../director/ProductPricingDirector';
import { getPriceLevels } from './utils/getPriceLevels';
import { getPriceRange } from './utils/getPriceRange';

export const configureProductPricesModule = ({
  proxyProducts,
}: {
  proxyProducts: (
    product: Product,
    vectors: Array<ProductConfiguration>,
    options: { includeInactive?: boolean },
  ) => Promise<Array<Product>>;
}): ProductsModule['prices'] => {
  const mapPrice: ProductsModule['prices']['price'] = async (
    product,
    { country: countryCode, currency: forcedCurrencyCode, quantity = 1 },
    requestContext,
  ) => {
    const currencyCode =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryCode,
        },
        requestContext,
      ));

    const pricing = getPriceLevels({
      product,
      currencyCode,
      countryCode,
    });

    const foundPrice = pricing.find((level) => !level.maxQuantity || level.maxQuantity >= quantity);

    const price = {
      amount: null,
      currencyCode,
      countryCode,
      isTaxable: false,
      isNetPrice: false,
      ...foundPrice,
    };

    if (price.amount !== undefined && price.amount !== null) {
      return {
        _id: crypto
          .createHash('sha256')
          .update([product._id, countryCode, currencyCode].join(''))
          .digest('hex'),
        ...price,
      };
    }
    return null;
  };

  const mapUserPrice: ProductsModule['prices']['userPrice'] = async (
    product,
    { quantity = 1, country, currency, useNetPrice },
    requestContext,
  ) => {
    const currencyCode =
      currency ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: country,
        },
        requestContext,
      ));

    const user = await requestContext.modules.users.findUser({
      userId: requestContext.userId,
    });
    const pricingDirector = await ProductPricingDirector.actions(
      {
        product,
        user,
        country,
        currency: currencyCode,
        quantity,
      },
      requestContext,
    );

    const calculated = await pricingDirector.calculate();
    if (!calculated || !calculated.length) return null;

    const pricing = ProductPricingDirector.resultSheet(calculated);
    const userPrice = pricing.unitPrice({ useNetPrice });

    return {
      _id: crypto
        .createHash('sha256')
        .update([product._id, country, quantity, useNetPrice, user ? user._id : 'ANONYMOUS'].join(''))
        .digest('hex'),
      amount: userPrice.amount,
      currencyCode: userPrice.currency,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  };

  return {
    price: mapPrice,
    userPrice: mapUserPrice,

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
      requestContext,
    ) => {
      const products = await proxyProducts(product, vectors, {
        includeInactive,
      });

      const filteredPrices = (
        await Promise.all(
          products.map((proxyProduct) =>
            mapPrice(
              proxyProduct,
              {
                country,
                quantity,
                currency,
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
            mapUserPrice(
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

    catalogPricesLeveled: async (
      product,
      { currency: currencyCode, country: countryCode },
      requestContext,
    ) => {
      const currency =
        currencyCode ||
        (await requestContext.services.countries.resolveDefaultCurrencyCode(
          {
            isoCode: countryCode,
          },
          requestContext,
        ));

      let previousMax = null;

      const filteredAndSortedPriceLevels = getPriceLevels({
        product,
        currencyCode: currency,
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
              .update([product._id, priceLevel.amount, currency].join(''))
              .digest('hex'),
            isTaxable: !!priceLevel.isTaxable,
            isNetPrice: !!priceLevel.isNetPrice,
            amount: priceLevel.amount,
            currencyCode: currency,
          },
        };
      });
    },
  };
};
