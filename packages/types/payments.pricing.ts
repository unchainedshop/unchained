import { Order } from './orders';
import { OrderDiscount } from './orders.discounts';
import { OrderPayment } from './orders.payments';
import { PaymentProvider } from './payments';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing';
import { User } from './user';

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
      orderPayment: OrderPayment;
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
  getFeeRows: () => Array<PaymentPricingCalculation>;
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
