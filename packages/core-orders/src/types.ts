import type { ProductPricingCalculation } from '@unchainedshop/core-products';
import type { TimestampFields, LogFields, Address, Contact } from '@unchainedshop/mongodb';
import { OrderPrice } from '@unchainedshop/types/orders.pricing.js';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULLFILLED = 'FULLFILLED',
  REJECTED = 'REJECTED',
}

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

export type Order = {
  _id?: string;
  billingAddress?: Address;
  calculation: Array<any>;
  confirmed?: Date;
  rejected?: Date;
  contact?: Contact;
  context?: any;
  countryCode: string;
  currency: string;
  deliveryId?: string;
  fullfilled?: Date;
  ordered?: Date;
  orderNumber?: string;
  originEnrollmentId?: string;
  paymentId?: string;
  status: OrderStatus | null;
  userId: string;
} & LogFields &
  TimestampFields;

export type OrderQuery = {
  includeCarts?: boolean;
  queryString?: string;
  status?: string;
  userId?: string;
};

export type OrderPositionDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPosition;
};
