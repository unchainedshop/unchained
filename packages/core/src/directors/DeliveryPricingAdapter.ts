import { DeliveryPricingSheet } from './DeliveryPricingSheet.ts';
import {
  type BasePricingAdapterContext,
  type IPricingAdapter,
  type IPricingSheet,
  BasePricingAdapter,
} from '../directors/index.ts';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { PricingCalculation } from '@unchainedshop/utils';
import type { OrderDelivery, OrderDiscount, Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';

export interface DeliveryPricingCalculation extends PricingCalculation {
  discountId?: string;
  isNetPrice: boolean;
  isTaxable: boolean;
  rate?: number;
}

export type IDeliveryPricingSheet = IPricingSheet<DeliveryPricingCalculation> & {
  addFee: (params: { amount: number; isTaxable: boolean; isNetPrice: boolean; meta?: any }) => void;
  addTax: (params: {
    amount: number;
    rate: number;
    baseCategory?: string;
    discountId?: string;
    meta?: any;
  }) => void;
  addDiscount: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    discountId: string;
    meta?: any;
  }) => void;
};

export interface DeliveryPricingAdapterContext extends BasePricingAdapterContext {
  countryCode?: string;
  currencyCode?: string;
  provider: DeliveryProvider;
  providerContext?: any;
  order: Order;
  orderDelivery?: OrderDelivery;
  user: User;
  discounts: OrderDiscount[];
}

export type IDeliveryPricingAdapter<DiscountConfiguration = unknown> = IPricingAdapter<
  DeliveryPricingAdapterContext & { modules: Modules },
  DeliveryPricingCalculation,
  IDeliveryPricingSheet,
  DiscountConfiguration
>;

const basePricingAdapter = BasePricingAdapter<
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation
>();

export const DeliveryPricingAdapter: IDeliveryPricingAdapter = {
  ...basePricingAdapter,

  isActivatedFor: () => {
    return false;
  },

  actions: (params) => {
    const { context } = params;
    const { currencyCode } = context;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = DeliveryPricingSheet({ currencyCode });

    return {
      ...baseActions,
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Delivery Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      resultSheet: () => resultSheet,
    };
  },
};
