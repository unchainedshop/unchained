import {
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingSheet,
} from '@unchainedshop/types/products.pricing';
import { IPricingAdapter } from '@unchainedshop/types/pricing';
import { BasePricingAdapter } from 'meteor/unchained:utils';
import { ProductPricingSheet } from './ProductPricingSheet';

const basePricingAdapter = BasePricingAdapter<
  ProductPricingAdapterContext,
  ProductPricingCalculation
>();

export const ProductPricingAdapter: IPricingAdapter<
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingSheet
> = {
  ...basePricingAdapter,

  isActivatedFor: async () => {
    return false;
  },

  actions: ({ context, calculation }) => {
    const { currency, quantity } = context;
    const calculationSheet = ProductPricingSheet({
      calculation,
      currency,
      quantity,
    });
    const resultSheet = ProductPricingSheet({ currency, quantity });

    return {
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(
            `Product Item Calculation -> ${category} ${amount}`
          )
        );
        return resultRaw;
      },
      calculationSheet: () => calculationSheet,
      resultSheet: () => resultSheet,
      resetCalculation() {
        // revert old prices
        calculationSheet.filterBy().forEach(({ amount, ...row }) => {
          resultSheet.calculation.push({
            ...row,
            amount: amount * -1,
          });
        });
      },
    };
  },
};
