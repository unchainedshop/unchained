import { Context } from './api';
import { Configuration, FindOptions, TimestampFields, _ID } from './common';
import { IOrderPricingSheet, OrderPrice } from './orders.pricing';
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

type OrderQuery = {
  orderId: string;
};

export type OrderPositionsModule = {
  // Queries
  findOrderPosition: (params: { itemId: string }) => Promise<OrderPosition>;
  findOrderPositions: (
    params: OrderQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions
  ) => Promise<Array<OrderPosition>>;

  // Transformations
  discounts: (
    orderPosition: OrderPosition,
    params: { currency?: string; discountId?: string }
  ) => Array<OrderPositionDiscount>;

  pricingSheet: (
    orderPosition: OrderPosition,
    params: { currency?: string }
  ) => IOrderPricingSheet;

  // Mutations
  create: (
    params: {
      configuration: Configuration;
      orderId: string;
      product: Product;
      quantity: number;
      quotationId?: string;
    },
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

  updateCalculation: (
    orderPosition: OrderPosition,
    requestContext: Context
  ) => Promise<OrderPosition>;
};

export type OrderPositionDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPosition;
};
