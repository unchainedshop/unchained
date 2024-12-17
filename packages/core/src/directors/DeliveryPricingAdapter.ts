import { DeliveryPricingSheet } from './DeliveryPricingSheet.js';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingSheet,
  BasePricingAdapter,
} from '../directors/index.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { PricingCalculation } from '@unchainedshop/utils';
import { OrderDelivery, OrderDiscount, Order } from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';
import { Modules } from '../modules.js';

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
  country?: string;
  currency?: string;
  provider: DeliveryProvider;
  providerContext?: any;
  order: Order;
  orderDelivery: OrderDelivery;
  user: User;
  discounts: Array<OrderDiscount>;
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
    const { currency } = context;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = DeliveryPricingSheet({ currency });

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
