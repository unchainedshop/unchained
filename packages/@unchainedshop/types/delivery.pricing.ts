import { OrderDelivery } from './orders.deliveries';
import { OrderDiscount } from './orders.discount';
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
import { DeliveryProvider } from '@unchainedshop/types/delivery';

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

export interface DeliveryPricingAdapterContext
  extends BasePricingAdapterContext {
  country?: string;
  currency?: string;
  deliveryProvider: DeliveryProvider;
  discounts: Array<Discount>;
  order: Order;
  orderDelivery: OrderDelivery;
  quantity: number;
  user: User;
}

export type DeliveryPricingContext = Omit<DeliveryPricingAdapterContext, 'discounts'> & {  
  providerContext?: any;
} | { item: OrderDelivery}

export interface IDeliveryPricingSheet
  extends IPricingSheet<DeliveryPricingCalculation> {}
export interface IDeliveryPricingAdapter
  extends IPricingAdapter<
    DeliveryPricingAdapterContext,
    DeliveryPricingCalculation,
    IDeliveryPricingSheet
  > {}

export interface IDeliveryPricingDirector
  extends IPricingDirector<
    DeliveryPricingContext,
    DeliveryPricingAdapterContext,
    DeliveryPricingCalculation,
    IDeliveryPricingAdapter
  > {}
