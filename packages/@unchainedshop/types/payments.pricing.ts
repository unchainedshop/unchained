import { Order } from './orders';
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

export interface PaymentPricingAdapterContext
  extends BasePricingAdapterContext {
  user: User;
  orderPayment: OrderPayment;
  order: Order;
  provider: PaymentProvider;
}

export type PaymentPricingContext =
  | {
      user: User;
      orderPayment: OrderPayment;
      order: Order;
      provider: PaymentProvider;
    }
  | {
      item: OrderPayment;
    };

export type IPaymentPricingSheet = IPricingSheet<PaymentPricingCalculation>;

export type IPaymentPricingAdapter = IPricingAdapter<
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingSheet
>;

export interface IPaymentPricingDirector
  extends IPricingDirector<
    PaymentPricingContext,
    PaymentPricingAdapterContext,
    PaymentPricingCalculation,
    IPaymentPricingAdapter
  > {
  resultSheet: () => IPaymentPricingSheet;
}
