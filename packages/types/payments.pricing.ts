import { Order } from './orders.js';
import { OrderDiscount } from './orders.discounts.js';
import { OrderPayment } from './orders.payments.js';
import { PaymentProvider } from './payments.js';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing.js';
import { User } from './user.js';

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
  feeSum: () => number;
  addFee: (params: { amount: number; isTaxable: boolean; isNetPrice: boolean; meta?: any }) => void;
};

export type IPaymentPricingAdapter = IPricingAdapter<
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingSheet
>;

export type IPaymentPricingDirector = IPricingDirector<
  PaymentPricingContext,
  PaymentPricingCalculation,
  PaymentPricingAdapterContext,
  IPaymentPricingSheet,
  IPaymentPricingAdapter
>;
