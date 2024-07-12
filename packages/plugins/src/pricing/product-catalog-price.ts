import { IProductPricingAdapter } from '@unchainedshop/types/products.pricing.js';
import { ProductPricingDirector, ProductPricingAdapter } from '@unchainedshop/core-products';
import { resolveBestCurrency } from '@unchainedshop/utils';

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
        const { product, country, currency: forcedCurrency, quantity, modules } = params.context;
        const countryObject = await modules.countries.findCountry({ isoCode: country });
        const currencies = await modules.currencies.findCurrencies({ includeInactive: false });
        const currency =
          forcedCurrency || resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

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
