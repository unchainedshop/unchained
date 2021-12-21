import { IProductPricingAdapter } from '@unchainedshop/types/products.pricing';
import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-products';

const ProductPrice: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-price',
  version: '1.0',
  label: 'Add Gross Price to Product',
  orderIndex: 0,

  isActivatedFor: async () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { product, country, currency, quantity } = params.context;

        const price = product.price({ country, currency, quantity });
        if (price === null || price === undefined) return null;
        const itemTotal = price.amount * quantity;

        pricingAdapter.resultSheet.addItem({
          amount: itemTotal,
          isTaxable: price.isTaxable,
          isNetPrice: price.isNetPrice,
          meta: { adapter: ProductPrice.key },
        });

        return await pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductPrice);
