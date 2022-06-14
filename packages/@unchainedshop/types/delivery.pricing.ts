import { DeliveryProvider } from './delivery';
import { Order } from './orders';
import { OrderDelivery } from './orders.deliveries';
import { OrderDiscount } from './orders.discounts';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing';
import { User } from './user';

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
      order: Order;
      orderDelivery: OrderDelivery;
      user: User;
      providerContext?: any;
    }
  | { item: OrderDelivery };

export type IDeliveryPricingSheet = IPricingSheet<DeliveryPricingCalculation>;

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
