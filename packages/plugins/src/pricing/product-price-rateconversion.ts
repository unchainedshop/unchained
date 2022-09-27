import { IProductPricingAdapter } from '@unchainedshop/types/products.pricing';
import { ProductPricingDirector, ProductPricingAdapter } from '@unchainedshop/core-products';

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
        const { product, country, quantity, currency: targetCurrency } = params.context;
        const fromCurrency = await services.countries.resolveDefaultCurrencyCode(
          {
            isoCode: country,
          },
          params.context,
        );

        const productPrice = await modules.products.prices.price(product, {
          country,
          currency: fromCurrency,
          quantity,
        });

        const { calculation = [] } = params.calculationSheet;
        if (
          !productPrice ||
          !productPrice?.amount ||
          calculation?.length ||
          fromCurrency === targetCurrency
        )
          return pricingAdapter.calculate();

        const fromCurrencyObj = await modules.currencies.findCurrency({
          isoCode: fromCurrency,
        });
        const targetCurrencyObj = await modules.currencies.findCurrency({
          isoCode: targetCurrency,
        });

        if (!targetCurrencyObj?.isActive) return pricingAdapter.calculate();

        const rate = await modules.products.prices.rates.getRate(fromCurrencyObj, targetCurrencyObj);

        if (rate > 0) {
          const convertedAmount = Math.round(productPrice.amount * rate);
          pricingAdapter.resultSheet().resetCalculation(params.calculationSheet);
          pricingAdapter.resultSheet().addItem({
            amount: convertedAmount * quantity,
            isTaxable: productPrice?.isTaxable,
            isNetPrice: productPrice?.isNetPrice,
            meta: { adapter: ProductPriceRateConversion.key, rate },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPriceRateConversion);
