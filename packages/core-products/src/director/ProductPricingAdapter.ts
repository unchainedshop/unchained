import {
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter,
} from '@unchainedshop/types/products.pricing';
import { BasePricingAdapter } from 'meteor/unchained:utils';
import { ProductPricingSheet } from './ProductPricingSheet';

const basePricingAdapter = BasePricingAdapter<ProductPricingAdapterContext, ProductPricingCalculation>();

export const ProductPricingAdapter: IProductPricingAdapter = {
  ...basePricingAdapter,

  isActivatedFor: () => {
    return false;
  },

  actions: ({ context }) => {
    const { currency, quantity } = context;
    const resultSheet = ProductPricingSheet({ currency, quantity });

    return {
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Product Item Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      resultSheet: () => resultSheet,
    };
  },
};
