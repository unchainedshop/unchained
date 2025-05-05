import { PricingCalculation } from '@unchainedshop/utils';
import {
  BasePricingAdapter,
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingSheet,
} from '../directors/index.js';
import { PaymentPricingSheet } from './PaymentPricingSheet.js';
import { PaymentProvider } from '@unchainedshop/core-payment';
import { OrderDiscount, OrderPayment, Order } from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';
import { Modules } from '../modules.js';

export interface PaymentPricingCalculation extends PricingCalculation {
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
}
export interface PaymentPricingAdapterContext extends BasePricingAdapterContext {
  countryCode?: string;
  currency?: string;
  user: User;
  orderPayment: OrderPayment;
  order: Order;
  provider: PaymentProvider;
  discounts: OrderDiscount[];
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

export type IPaymentPricingAdapter<DiscountConfiguration = unknown> = IPricingAdapter<
  PaymentPricingAdapterContext & { modules: Modules },
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
    const { currencyCode } = context.order;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = PaymentPricingSheet({ currencyCode });

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
