import {
  ProductPricingDirector,
  ProductPricingAdapter,
  UnchainedCore,
  IProductPricingAdapter,
} from '@unchainedshop/core';
import { resolveBestCurrency } from '@unchainedshop/utils';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

const { NODE_ENV } = process.env;

const memoizeCache = new ExpiryMap(NODE_ENV === 'production' ? 1000 * 60 : 100); // Cached values expire after 10 seconds

export const resolveCurrency = pMemoize(
  async (context) => {
    const { country, currency: forcedCurrency, modules } = context;
    const countryObject = await modules.countries.findCountry({ isoCode: country });
    const currencies = await modules.currencies.findCurrencies({ includeInactive: false });
    const currency =
      forcedCurrency || resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);
    return currency;
  },
  {
    cache: memoizeCache,
    cacheKey(args) {
      return `${args[0].currency}-${args[0].country}`;
    },
  },
);

export const ProductPrice: IProductPricingAdapter<UnchainedCore> = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-price',
  version: '1.0.0',
  label: 'Add Gross Price to Product',
  orderIndex: 0,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { product, country, quantity, modules } = params.context;
        const currency = await resolveCurrency(params.context);
        const price = await modules.products.prices.price(product, { country, currency, quantity });
        if (price) {
          const itemTotal = price.amount * quantity;
          pricingAdapter.resultSheet().addItem({
            amount: itemTotal,
            isTaxable: price.isTaxable,
            isNetPrice: price.isNetPrice,
            meta: { adapter: ProductPrice.key },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPrice);
