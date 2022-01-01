import { Configuration, FindOptions, TimestampFields, _ID } from './common';
import { OrderPrice } from './orders.pricing';
import { Product } from './products';
import { IProductPricingSheet } from './products.pricing';

export type OrderPosition = {
  _id: _ID;
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
  findOrders: (
    params: OrderQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions
  ) => Promise<Array<OrderPosition>>;
  count: (query: OrderQuery) => Promise<number>;

  // Transformations
  pricingSheet: (position: OrderPosition) => IProductPricingSheet;

  // Mutations
  create: (
    params: {
      configuration: Configuration;
      orderId: string;
      product: Product;
      quantity: number;
    },
    userId?: string
  ) => Promise<OrderPosition>;

  removePositions: ({ orderId: string }, userId?: string) => Promise<number>;

  update: (
    query: { orderId: string; positionId: string },
    params: { quantity?: number; configuration?: Configuration },
    userId?: string
  ) => Promise<OrderPosition>;

  updateCalculation: (_id: _ID) => Promise<boolean>;
};

export type OrderPositionDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPosition;
};
