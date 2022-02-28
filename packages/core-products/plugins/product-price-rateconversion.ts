import { IProductPricingAdapter } from '@unchainedshop/types/products.pricing';
import { ProductPricingDirector, ProductPricingAdapter } from 'meteor/unchained:core-products';

const { RATECONVERSION_MAX_AGE = '360' } = process.env;

const MAX_RATE_AGE = parseInt(RATECONVERSION_MAX_AGE, 10);

const ProductPriceRateConversion: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.rate-conversion',
  version: '1.0',
  label: 'Generic rate conversion plugin that converts between rates if entry in DB exists.',
  orderIndex: 1,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);
    const { services, modules } = params.context;
    return {
      ...pricingAdapter,

      calculate: async () => {
        const { product, country, quantity, currency } = params.context;
        const defaultCurrency = await services.countries.resolveDefaultCurrencyCode(
          {
            isoCode: country,
          },
          params.context,
        );

        const productPrice = await modules.products.prices.price(
          product,
          {
            country,
            currency: defaultCurrency,
            quantity,
          },
          params.context,
        );

        const { calculation = [] } = pricingAdapter.calculationSheet;
        if (
          !productPrice ||
          !productPrice?.amount ||
          calculation?.length ||
          defaultCurrency === currency
        )
          return pricingAdapter.calculate();

        const rate = await modules.products.prices.rates.getRate(
          defaultCurrency,
          currency,
          MAX_RATE_AGE,
        );

        if (rate > 0) {
          const convertedAmount = productPrice.amount * rate;
          pricingAdapter.resetCalculation();
          pricingAdapter.resultSheet().addItem({
            amount: convertedAmount * quantity,
            isTaxable: productPrice?.isTaxable,
            isNetPrice: productPrice?.isNetPrice,
            meta: { adapter: ProductPriceRateConversion.key },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPriceRateConversion);
