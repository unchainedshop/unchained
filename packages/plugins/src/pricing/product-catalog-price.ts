import { IProductPricingAdapter } from '@unchainedshop/core-products';
import { ProductPricingDirector, ProductPricingAdapter } from '@unchainedshop/core-products';
import { resolveBestCurrency } from '@unchainedshop/utils';
import memoizee from 'memoizee';

const { NODE_ENV } = process.env;

export const resolveCurrency = memoizee(
  async (context) => {
    const { country, currency: forcedCurrency, modules } = context;
    const countryObject = await modules.countries.findCountry({ isoCode: country });
    const currencies = await modules.currencies.findCurrencies({ includeInactive: false });
    const currency =
      forcedCurrency || resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);
    return currency;
  },
  {
    maxAge: NODE_ENV === 'production' ? 1000 * 60 : 100, // minute or 100ms
    promise: true,
    normalizer(args) {
      return `${args[0].currency}-${args[0].country}`;
    },
  },
);

export const ProductPrice: IProductPricingAdapter = {
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
