import { BasePricingAdapter, BasePricingAdapterContext, IPricingAdapter } from '@unchainedshop/utils';
import {
  IProductPricingSheet,
  ProductPricingCalculation,
  ProductPricingSheet,
  Product,
  ProductConfiguration,
} from '@unchainedshop/core-products';
import { Order } from '@unchainedshop/core-orders';

export interface ProductPricingAdapterContext extends BasePricingAdapterContext {
  country: string;
  currency: string;
  product: Product;
  quantity: number;
  configuration: Array<ProductConfiguration>;
  order?: Order;
}

export type IProductPricingAdapter<
  UnchainedAPI = unknown,
  DiscountConfiguration = unknown,
> = IPricingAdapter<
  ProductPricingAdapterContext & UnchainedAPI,
  ProductPricingCalculation,
  IProductPricingSheet,
  DiscountConfiguration
>;

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
