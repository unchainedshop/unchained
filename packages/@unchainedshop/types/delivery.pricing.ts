import { Discount } from './orders.discount';
import { Order, OrderDelivery, OrderDiscount } from './orders';
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

export interface DeliveryPricingAdapterContext
  extends BasePricingAdapterContext {
  country?: string;
  currency?: string;
  deliveryProvider: any; // TODO: Replace with delivery provider
  discounts: Array<Discount>;
  order: Order;
  orderDelivery: OrderDelivery;
  quantity: number;
  user: User;
}

export interface DeliveryPricingContext {
  country?: string;
  currency?: string;
  deliveryProvider?: any; // TODO: Replace with delivery provider
  discounts: Array<OrderDiscount>;
  order?: Order;
  orderDelivery?: OrderDelivery;
  providerContext?: any;
  quantity?: number;
  user?: User;
}

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
  > {
  resultSheet: () => IDeliveryPricingSheet;
}
