import {
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter,
} from '../types.js';
import { BasePricingAdapter } from '@unchainedshop/utils';
import { ProductPricingSheet } from './ProductPricingSheet.js';

const basePricingAdapter = BasePricingAdapter<ProductPricingAdapterContext, ProductPricingCalculation>();

export const ProductPricingAdapter: IProductPricingAdapter = {
  ...basePricingAdapter,

  isActivatedFor: () => {
    return false;
  },

  actions: (params) => {
    const { context } = params;
    const { currency, quantity } = context;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = ProductPricingSheet({ currency, quantity });

    return {
      ...baseActions,
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
