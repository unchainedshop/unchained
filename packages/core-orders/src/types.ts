import { TimestampFields, LogFields, Address, Contact } from '@unchainedshop/mongodb';
import { PricingCalculation, Price } from '@unchainedshop/utils';

// TODO: Propably, all this calculation interfaces should be
// part of this package and used by the core when directors are there
export interface OrderPositionPricingCalculation extends PricingCalculation {
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
}

export type OrderReport = {
  newCount: number;
  checkoutCount: number;
  rejectCount: number;
  confirmCount: number;
  fulfillCount: number;
};

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULLFILLED = 'FULLFILLED',
  REJECTED = 'REJECTED',
}

export type OrderPosition = {
  _id?: string;
  calculation: Array<OrderPositionPricingCalculation>;
  configuration: Array<{ key: string; value: string }>;
  context?: any;
  orderId: string;
  originalProductId: string;
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

export enum OrderDiscountTrigger {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export type OrderDiscount = {
  _id?: string;
  orderId: string;
  code?: string;
  total?: Price;
  trigger?: OrderDiscountTrigger;
  discountKey?: string;
  reservation?: any;
  context?: any;
} & TimestampFields;

export type OrderQuery = {
  includeCarts?: boolean;
  orderStatus?: OrderStatus[];
  queryString?: string;
  status?: OrderStatus[];
  userId?: string;
};

export enum OrderDeliveryStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

export enum OrderPaymentStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export type OrderPayment = {
  _id?: string;
  orderId: string;
  context?: any;
  paid?: Date;
  transactionId?: string;
  paymentProviderId?: string;
  status?: OrderPaymentStatus | null;
  calculation?: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderPaymentDiscount = Omit<Price, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPayment;
};

export type OrderDelivery = {
  _id?: string;
  orderId: string;
  deliveryProviderId: string;
  delivered?: Date;
  status: OrderDeliveryStatus | null;
  context?: any;
  calculation: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderDeliveryDiscount = Omit<Price, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderDelivery;
};

export type OrderPositionDiscount = Omit<Price, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPosition;
};
