import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingSheet,
  PricingCalculation,
} from '@unchainedshop/utils';
import { BasePricingAdapter } from '@unchainedshop/utils';
import { PaymentPricingSheet } from './PaymentPricingSheet.js';
import { PaymentProvider } from '@unchainedshop/core-payment';
import { OrderDiscount, OrderPayment, Order } from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';

export interface PaymentPricingCalculation extends PricingCalculation {
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
}
export interface PaymentPricingAdapterContext extends BasePricingAdapterContext {
  country?: string;
  currency?: string;
  user: User;
  orderPayment: OrderPayment;
  order: Order;
  provider: PaymentProvider;
  discounts: Array<OrderDiscount>;
}

export type IPaymentPricingSheet = IPricingSheet<PaymentPricingCalculation> & {
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

export type IPaymentPricingAdapter<
  UnchainedAPI = unknown,
  DiscountConfiguration = unknown,
> = IPricingAdapter<
  PaymentPricingAdapterContext & UnchainedAPI,
  PaymentPricingCalculation,
  IPaymentPricingSheet,
  DiscountConfiguration
>;

const basePricingAdapter = BasePricingAdapter<PaymentPricingAdapterContext, PaymentPricingCalculation>();

export const PaymentPricingAdapter: IPricingAdapter<
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingSheet
> = {
  ...basePricingAdapter,

  isActivatedFor: () => {
    return false;
  },

  actions: (params) => {
    const { context } = params;
    const { currency } = context.order;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = PaymentPricingSheet({ currency });

    return {
      ...baseActions,
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Payment Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      resultSheet: () => resultSheet,
    };
  },
};
