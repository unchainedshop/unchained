import { Configuration, FindOptions, TimestampFields, _ID } from './common';
import { UnchainedCore } from './core';
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
    unchainedAPI: UnchainedCore,
  ) => Array<OrderPricingDiscount>;

  pricingSheet: (
    orderPosition: OrderPosition,
    currency: string,
    unchainedAPI: UnchainedCore,
  ) => IProductPricingSheet;

  // Mutations
  create: (
    doc: Partial<OrderPosition>,
    params: { order: Order; product: Product; originalProduct?: Product },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPosition>;

  delete: (orderPositionId: string, unchainedAPI: UnchainedCore) => Promise<OrderPosition>;

  removePositions: ({ orderId }: { orderId: string }, unchainedAPI: UnchainedCore) => Promise<number>;
  removeProductByIdFromAllPositions: (
    { productId }: { productId: string },
    unchainedAPI: UnchainedCore,
  ) => Promise<number>;

  updateProductItem: (
    doc: {
      context?: any;
      configuration?: Configuration;
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
      configuration?: Configuration;
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
