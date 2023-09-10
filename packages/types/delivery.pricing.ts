import { DeliveryProvider } from './delivery.js';
import { Order } from './orders.js';
import { OrderDelivery } from './orders.deliveries.js';
import { OrderDiscount } from './orders.discounts.js';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing.js';
import { User } from './user.js';

/*
 * Delivery pricing
 */

export enum DeliveryPricingRowCategory {
  Delivery = 'DELIVERY',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
  Item = 'ITEM', // Propably unused
}

export interface DeliveryPricingCalculation extends PricingCalculation {
  discountId?: string;
  isNetPrice: boolean;
  isTaxable: boolean;
  rate?: number;
}

export interface DeliveryPricingAdapterContext extends BasePricingAdapterContext {
  country?: string;
  currency?: string;
  provider: DeliveryProvider;
  providerContext?: any;
  order: Order;
  orderDelivery: OrderDelivery;
  user: User;
  discounts: Array<OrderDiscount>;
}

export type DeliveryPricingContext =
  | {
      country?: string;
      currency?: string;
      provider: DeliveryProvider;
      providerContext?: any;
      order: Order;
      user: User;
    }
  | { item: OrderDelivery };

export type IDeliveryPricingSheet = IPricingSheet<DeliveryPricingCalculation> & {
  addFee: (params: { amount: number; isTaxable: boolean; isNetPrice: boolean; meta?: any }) => void;
  addTax: (params: { amount: number; rate: number; meta?: any }) => void;
  addDiscount: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    discountId: string;
    meta?: any;
  }) => void;
};

export type IDeliveryPricingAdapter = IPricingAdapter<
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingSheet
>;

export type IDeliveryPricingDirector = IPricingDirector<
  DeliveryPricingContext,
  DeliveryPricingCalculation,
  DeliveryPricingAdapterContext,
  IDeliveryPricingSheet,
  IDeliveryPricingAdapter
>;
