import {
  IProductPricingAdapter,
  ProductPricingDirector,
  ProductPricingAdapter,
} from '@unchainedshop/core';

export const ProductPriceRateConversion: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.rate-conversion',
  version: '1.0.0',
  label: 'Generic rate conversion plugin that converts between rates if entry in DB exists.',
  orderIndex: 10,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);
    const { modules } = params.context;
    return {
      ...pricingAdapter,

      calculate: async () => {
        const { product, country, quantity, currency: targetCurrency } = params.context;

        const { calculation = [] } = params.calculationSheet;
        if (calculation?.length) {
          // If we already have a price for the product,
          // we skip this plugin because we don't need to convert
          return pricingAdapter.calculate();
        }

        const productPrice = await modules.products.prices.price(product, {
          country,
          quantity,
        });

        if (!productPrice) {
          // We were not able to find a price for quantity & country
          return pricingAdapter.calculate();
        }

        const fromCurrencyObj = await modules.currencies.findCurrency({
          isoCode: productPrice.currencyCode,
        });
        const targetCurrencyObj = await modules.currencies.findCurrency({
          isoCode: targetCurrency,
        });

        if (!targetCurrencyObj?.isActive || !fromCurrencyObj?.isActive)
          return pricingAdapter.calculate();

        const rateData = await modules.products.prices.rates.getRate(fromCurrencyObj, targetCurrencyObj);

        if (rateData?.rate > 0) {
          const convertedAmount = Math.round(productPrice.amount * rateData.rate);
          pricingAdapter.resultSheet().resetCalculation(params.calculationSheet);
          pricingAdapter.resultSheet().addItem({
            amount: convertedAmount * quantity,
            isTaxable: productPrice?.isTaxable,
            isNetPrice: productPrice?.isNetPrice,
            meta: { adapter: ProductPriceRateConversion.key, rate: rateData.rate },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPriceRateConversion);
