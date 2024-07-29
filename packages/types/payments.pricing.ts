import type { User } from '@unchainedshop/core-users';
import type { PaymentProvider } from '@unchainedshop/core-payment';

import { Order } from './orders.js';
import { OrderDiscount } from './orders.discounts.js';
import { OrderPayment } from './orders.payments.js';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing.js';

/*
 * Payment pricing
 */

export enum PaymentPricingRowCategory {
  Item = 'ITEM',
  Payment = 'PAYMENT',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
}

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

export type PaymentPricingContext =
  | {
      country?: string;
      currency?: string;
      user: User;
      order: Order;
      provider: PaymentProvider;
      providerContext?: any;
    }
  | {
      item: OrderPayment;
    };

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
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingSheet,
  DiscountConfiguration
>;

export type IPaymentPricingDirector<DiscountConfiguration = unknown> = IPricingDirector<
  PaymentPricingContext,
  PaymentPricingCalculation,
  PaymentPricingAdapterContext,
  IPaymentPricingSheet,
  IPaymentPricingAdapter<DiscountConfiguration>
>;
