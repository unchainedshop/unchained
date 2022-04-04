import { Order } from './orders';
import { OrderDelivery } from './orders.deliveries';
import { OrderDiscount } from './orders.discounts';
import { OrderPayment } from './orders.payments';
import { OrderPosition } from './orders.positions';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
  PricingDiscount,
} from './pricing';
import { User } from './user';

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

export type OrderPrice = { _id?: string; amount: number; currency: string };

export type OrderPricingDiscount = PricingDiscount & {
  delivery?: OrderDelivery;
  item?: OrderPosition;
  order?: Order;
  payment?: OrderPayment;
};

export interface OrderPricingCalculation extends PricingCalculation {
  discountId?: string;
}

export interface OrderPricingAdapterContext extends BasePricingAdapterContext {
  currency?: string;
  discounts: Array<OrderDiscount>;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  orderPayment: OrderPayment;
  user: User;
}

export interface OrderPricingContext {
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  orderPayment: OrderPayment;
}

export interface IOrderPricingSheet extends IPricingSheet<OrderPricingCalculation> {
  addDiscounts: (params: { amount: number; discountId: string; meta?: any }) => void;
  addDelivery: (params: { amount: number; meta?: any }) => void;
  addItems: (params: { amount: number; meta?: any }) => void;
  addPayment: (params: { amount: number; meta?: any }) => void;
  addTaxes: (params: { amount: number; meta?: any }) => void;

  itemsSum: () => number;

  getItemsRows: () => Array<OrderPricingCalculation>;
  getDeliveryRows: () => Array<OrderPricingCalculation>;
  getPaymentRows: () => Array<OrderPricingCalculation>;
}

export type IOrderPricingAdapter = IPricingAdapter<
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingSheet
>;

export type IOrderPricingDirector = IPricingDirector<
  OrderPricingContext,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingAdapter
>;
