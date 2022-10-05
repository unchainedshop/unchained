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

        if (!targetCurrencyObj?.isActive) return pricingAdapter.calculate();

        const rate = await modules.products.prices.rates.getRate(fromCurrencyObj, targetCurrencyObj);

        // 1 USD = 0.00075 ETH
        // 100000 = 100.00 USD
        // 0.075 ETH in 9 Decimals = 

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
