import { Context } from './api';
import {
  LogFields,
  ModuleMutations,
  TimestampFields,
  Update,
  _ID,
} from './common';
import { IOrderPricingSheet, OrderPrice } from './orders.pricing';

export enum OrderDeliveryStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

export type OrderDelivery = {
  _id: _ID;
  orderId: string;
  deliveryProviderId: string;
  delivered?: Date;
  status: OrderDeliveryStatus | null;
  context?: any;
  calculation: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderDeliveriesModule = {
  // Queries
  findDelivery: (params: { orderDeliveryId: string }) => Promise<OrderDelivery>;

  // Transformations
  isBlockingOrderFullfillment: (orderDelivery: OrderDelivery) => boolean;
  normalizedStatus: (orderDelivery: OrderDelivery) => string;
  pricingSheet: (
    orderDelivery: OrderDelivery,
    currency: string
  ) => IOrderPricingSheet;

  // Mutations
  create: (doc: OrderDelivery, userId?: string) => Promise<OrderDelivery>;
  delete: (orderDeliveryId: string, userId?: string) => Promise<number>;

  markAsDelivered: (
    orderDelivery: OrderDelivery,
    userId?: string
  ) => Promise<void>;

  updateDelivery: (
    orderDeliveryId: string,
    params: { context: any; orderId: string },
    requestContext: Context
  ) => Promise<OrderDelivery>;

  updateStatus: (
    orderDeliveryId: string,
    params: { status: OrderDeliveryStatus; info?: string },
    userId?: string
  ) => Promise<OrderDelivery>;

  updateCalculation: (
    orderDelivery: OrderDelivery,
    requestContext: Context
  ) => Promise<boolean>;
};

export type OrderDeliveryDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderDelivery;
};
