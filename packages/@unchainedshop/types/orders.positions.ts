import { Context } from './api';
import { Configuration, FindOptions, TimestampFields, _ID } from './common';
import { Order } from './orders';
import { OrderDelivery } from './orders.deliveries';
import { OrderDiscount } from './orders.discounts';
import {
  IOrderPricingSheet,
  OrderPrice,
  OrderPricingDiscount,
} from './orders.pricing';
import { Product } from './products';

export type OrderPosition = {
  _id?: _ID;
  calculation: Array<any>;
  configuration: Configuration;
  context?: any;
  orderId: string;
  originalProductId?: string;
  productId: string;
  quantity: number;
  quotationId?: string;
  scheduling: Array<any>;
} & TimestampFields;

export type OrderPositionsModule = {
  // Queries
  findOrderPosition: (params: { itemId: string }) => Promise<OrderPosition>;
  findOrderPositions: (params: {
    orderId: string;
  }) => Promise<Array<OrderPosition>>;

  // Transformations
  discounts: (
    orderPosition: OrderPosition,
    params: { order: Order; orderDiscount: OrderDiscount },
    requestContext: Context
  ) => Array<OrderPricingDiscount>;

  pricingSheet: (
    orderPosition: OrderPosition,
    params: { currency?: string }
  ) => IOrderPricingSheet;

  // Mutations
  create: (
    doc: Partial<OrderPosition>,
    params: { order: Order; product: Product; originalProduct: Product },
    requestContext: Context
  ) => Promise<OrderPosition>;

  delete: (
    orderPositionId: string,
    requestContext: Context
  ) => Promise<OrderPosition>;

  removePositions: (
    { orderId: string },
    requestContext: Context
  ) => Promise<number>;

  update: (
    query: { orderId: string; orderPositionId: string },
    params: { quantity?: number; configuration?: Configuration },
    requestContext: Context
  ) => Promise<OrderPosition>;

  updateScheduling: (
    params: {
      order: Order;
      orderDelivery: OrderDelivery;
      orderPosition: OrderPosition;
    },
    requestContext: Context
  ) => Promise<boolean>;

  updateCalculation: (
    orderPosition: OrderPosition,
    requestContext: Context
  ) => Promise<OrderPosition>;

  addProductItem: (
    doc: OrderPosition,
    params: { order: Order; product: Product },
    requestContext: Context
  ) => Promise<OrderPosition>;
};

export type OrderPositionDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPosition;
};
