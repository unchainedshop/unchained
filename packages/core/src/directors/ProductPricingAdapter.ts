import type { Product, ProductConfiguration } from '@unchainedshop/core-products';
import type { Order } from '@unchainedshop/core-orders';
import {
  type IProductPricingSheet,
  type ProductPricingCalculation,
  ProductPricingSheet,
  BasePricingAdapter,
  type BasePricingAdapterContext,
  type IPricingAdapter,
} from '../directors/index.ts';
import type { Modules } from '../modules.ts';
import type { User } from '@unchainedshop/core-users';

export interface ProductPricingAdapterContext extends BasePricingAdapterContext {
  countryCode: string;
  currencyCode: string;
  product: Product;
  quantity: number;
  configuration: ProductConfiguration[] | null;
  order?: Order;
  user?: User;
}

export type IProductPricingAdapter<DiscountConfiguration = unknown> = IPricingAdapter<
  ProductPricingAdapterContext & { modules: Modules },
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
    const { currencyCode, quantity } = context;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = ProductPricingSheet({ currencyCode, quantity });

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
