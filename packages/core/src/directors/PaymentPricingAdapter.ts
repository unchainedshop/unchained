import type { PricingCalculation } from '@unchainedshop/utils';
import {
  BasePricingAdapter,
  type BasePricingAdapterContext,
  type IPricingAdapter,
  type IPricingSheet,
} from '../directors/index.ts';
import { PaymentPricingSheet } from './PaymentPricingSheet.ts';
import type { PaymentProvider } from '@unchainedshop/core-payment';
import type { OrderDiscount, OrderPayment, Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';

export interface PaymentPricingCalculation extends PricingCalculation {
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
}
export interface PaymentPricingAdapterContext extends BasePricingAdapterContext {
  countryCode?: string;
  currency?: string;
  user: User | null;
  orderPayment?: OrderPayment;
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
