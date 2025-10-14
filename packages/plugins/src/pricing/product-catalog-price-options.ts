import {
  ProductPricingDirector,
  ProductPricingAdapter,
  type IProductPricingAdapter,
} from '@unchainedshop/core';

const ProductPrice: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-price-options',
  version: '1.0',
  label: 'Add Gross Price of Options',
  orderIndex: 1,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);
    const { countryCode, currencyCode, quantity, modules } = params.context;

    return {
      ...pricingAdapter,

      async calculatePriceForProduct(product) {
        const price = await modules.products.prices.price(product, {
          countryCode,
          currencyCode,
          quantity,
        });
        if (price) {
          const itemTotal = price.amount * quantity;
          pricingAdapter.resultSheet().addItem({
            amount: itemTotal,
            isTaxable: Boolean(price.isTaxable),
            isNetPrice: Boolean(price.isNetPrice),
            meta: { adapter: ProductPrice.key },
          });
        }
      },

      async calculate() {
        const { configuration } = params.context;

        const productIds = configuration?.flatMap(({ key, value }) => {
          if (key === 'option') return [value];
          return [];
        });

        if (!productIds?.length) {
          return pricingAdapter.calculate();
        }

        const options = await modules.products.findProducts({
          productIds,
        });

        await Promise.all(options.map(this.calculatePriceForProduct));

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPrice);
