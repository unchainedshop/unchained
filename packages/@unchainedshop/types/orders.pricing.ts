import { Discount } from './discount';
import { Order } from './orders';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing';
import { User } from './user';
import { OrderDelivery } from './orders.deliveries';
import { OrderPayment } from './orders.payments';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts';
import { OrderPosition } from './orders.positions';

/*
 * Order pricing
 */

export enum OrderPricingRowCategory {
  Items = 'ITEMS',
  Discounts = 'DISCOUNTS',
  Taxes = 'TAXES',
  Delivery = 'DELIVERY',
  Payment = 'PAYMENT',
}

export type OrderPrice = { _id: string; amount: number; currency: string };

export interface OrderPricingCalculation extends PricingCalculation {
  discountId?: string;
}

export interface OrderPricingAdapterContext extends BasePricingAdapterContext {
  currency?: string;
  discounts: Array<Discount>;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  orderPayment: OrderPayment;
  user: User;
}

export interface OrderPricingContext {
  order: Order;
}

export interface IOrderPricingSheet
  extends IPricingSheet<OrderPricingCalculation> {
  addDiscounts: (params: {
    amount: number;
    discountId: string;
    meta?: any;
  }) => void;
  addDelivery: (params: { amount: number; meta?: any }) => void;
  addItems: (params: { amount: number; meta?: any }) => void;
  addPayment: (params: { amount: number; meta?: any }) => void;
  addTaxes: (params: { amount: number; meta?: any }) => void;

  itemsSum: () => number;

  getItemsRows: () => Array<OrderPricingCalculation>;
  getDeliveryRows: () => Array<OrderPricingCalculation>;
  getPaymentRows: () => Array<OrderPricingCalculation>;
}

export interface IOrderPricingAdapter
  extends IPricingAdapter<
    OrderPricingAdapterContext,
    OrderPricingCalculation,
    IOrderPricingSheet
  > {}

export interface IOrderPricingDirector
  extends IPricingDirector<
    OrderPricingContext,
    OrderPricingAdapterContext,
    OrderPricingCalculation,
    IOrderPricingAdapter
  > {
  resultSheet: () => IOrderPricingSheet;
}
