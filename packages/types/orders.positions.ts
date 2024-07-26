import type { FindOptions } from 'mongodb';
import { UnchainedCore } from './core.js';
import { Order } from './orders.js';
import { OrderDelivery } from './orders.deliveries.js';
import { OrderDiscount } from './orders.discounts.js';
import { OrderPrice, OrderPricingDiscount } from './orders.pricing.js';
import { Product } from './products.js';
import { IProductPricingSheet, ProductPricingCalculation } from './products.pricing.js';
import type { TimestampFields } from '@unchainedshop/mongodb';

export type OrderPosition = {
  _id?: string;
  calculation: Array<ProductPricingCalculation>;
  configuration: Array<{ key: string; value: string }>;
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
    unchainedAPI: UnchainedCore,
  ) => Array<OrderPricingDiscount>;

  pricingSheet: (
    orderPosition: OrderPosition,
    currency: string,
    unchainedAPI: UnchainedCore,
  ) => IProductPricingSheet;

  delete: (orderPositionId: string) => Promise<OrderPosition>;

  removePositions: ({ orderId }: { orderId: string }) => Promise<number>;
  removeProductByIdFromAllOpenPositions: (productId: string) => Promise<Array<string>>;

  updateProductItem: (
    doc: {
      context?: any;
      configuration?: Array<{ key: string; value: string }>;
      quantity?: number;
    },
    params: { order: Order; product: Product; orderPosition: OrderPosition },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;

  updateScheduling: (
    params: {
      order: Order;
      orderDelivery: OrderDelivery;
      orderPosition: OrderPosition;
    },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;

  updateCalculation: (
    orderPosition: OrderPosition,
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;

  addProductItem: (
    doc: {
      context?: any;
      configuration?: Array<{ key: string; value: string }>;
      orderId?: string;
      originalProductId?: string;
      productId?: string;
      quantity: number;
      quotationId?: string;
    },
    params: { order: Order; product: Product },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;
};

export type OrderPositionDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPosition;
};
