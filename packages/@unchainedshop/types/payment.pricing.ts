import { Order, OrderPayment } from './orders';
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

export interface PaymentPricingContext {
  user: User;
  orderPayment: OrderPayment;
  order: Order;
  provider: PaymentProvider;
}

export interface IPaymentPricingSheet
  extends IPricingSheet<PaymentPricingCalculation> {}

export interface IPaymentPricingAdapter
  extends IPricingAdapter<
    PaymentPricingAdapterContext,
    PaymentPricingCalculation,
    IPaymentPricingSheet
  > {}

export interface IPaymentPricingDirector
  extends IPricingDirector<
    PaymentPricingContext,
    PaymentPricingAdapterContext,
    PaymentPricingCalculation,
    IPaymentPricingAdapter
  > {
  resultSheet: () => IPaymentPricingSheet;
}
