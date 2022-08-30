import { Context } from './api';
import { Configuration, FindOptions, TimestampFields, _ID } from './common';
import { Order } from './orders';
import { OrderDelivery } from './orders.deliveries';
import { OrderDiscount } from './orders.discounts';
import { OrderPrice, OrderPricingDiscount } from './orders.pricing';
import { Product } from './products';
import { IProductPricingSheet, ProductPricingCalculation } from './products.pricing';

export type OrderPosition = {
  _id?: _ID;
  calculation: Array<ProductPricingCalculation>;
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
  findOrderPosition: (params: { itemId: string }, options?: FindOptions) => Promise<OrderPosition>;
  findOrderPositions: (params: { orderId: string }) => Promise<Array<OrderPosition>>;

  // Transformations
  discounts: (
    orderPosition: OrderPosition,
    params: { order: Order; orderDiscount: OrderDiscount },
    requestContext: Context,
  ) => Array<OrderPricingDiscount>;

  pricingSheet: (
    orderPosition: OrderPosition,
    currency: string,
    requestContext: Context,
  ) => IProductPricingSheet;

  // Mutations
  create: (
    doc: Partial<OrderPosition>,
    params: { order: Order; product: Product; originalProduct?: Product },
    requestContext: Context,
  ) => Promise<OrderPosition>;

  delete: (orderPositionId: string, requestContext: Context) => Promise<OrderPosition>;

  removePositions: ({ orderId }: { orderId: string }, requestContext: Context) => Promise<number>;

  updateProductItem: (
    doc: {
      context?: any;
      configuration?: Configuration;
      quantity?: number;
    },
    params: { order: Order; product: Product; orderPosition: OrderPosition },
    requestContext: Context,
  ) => Promise<OrderPosition>;

  updateScheduling: (
    params: {
      order: Order;
      orderDelivery: OrderDelivery;
      orderPosition: OrderPosition;
    },
    requestContext: Context,
  ) => Promise<OrderPosition>;

  updateCalculation: (orderPosition: OrderPosition, requestContext: Context) => Promise<OrderPosition>;

  addProductItem: (
    doc: {
      context?: any;
      configuration?: Configuration;
      orderId?: string;
      originalProductId?: string;
      productId?: string;
      quantity: number;
      quotationId?: string;
    },
    params: { order: Order; product: Product },
    requestContext: Context,
  ) => Promise<OrderPosition>;
};

export type OrderPositionDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPosition;
};
