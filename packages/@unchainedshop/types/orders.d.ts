import { Address, Contact, LogFields, TimestampFields } from './common';

export enum OrderStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULLFILLED = 'FULLFILLED',
}

export enum OrderDeliveryStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

export enum OrderDiscountTrigger {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export enum OrderPaymentStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum OrderDocumentTypes {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  OTHER = 'OTHER',
}

export type Order = {
  billingAddress?: Address;
  calculation: Array<any>;
  confirmed?: Date;
  contact?: Contact;
  context?: any;
  countryCode?: string;
  currency?: string;
  deliveryId?: string;
  fullfilled?: Date;
  ordered?: Date;
  orderNumber?: string;
  originEnrollmentId?: string;
  paymentId?: string;
  status: OrderStatus | null;
  userId?: string;
} & LogFields &
  TimestampFields;

export type OrderPosition = {
  calculation: Array<any>;
  configuration: Array<{ key: string; value: string }>;
  context?: any;
  orderId: string;
  originalProductId?: string;
  productId: string;
  quantity: number;
  quotationId?: string;
  scheduling: Array<any>;
} & TimestampFields;

export type OrderDiscount = {
  orderId: string;
  code?: string;
  trigger: OrderDiscountTrigger;
  discountKey: string;
  reservation?: any;
  context?: any;
} & TimestampFields;

export type OrderDelivery = {
  orderId: string;
  deliveryProviderId: string;
  delivered?: Date;
  status: OrderDeliveryStatus | null;
  context?: any;
  calculation: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderPayment = {
  orderId: string;
  context?: any;
  paid?: Date;
  paymentProviderId?: string;
  status?: OrderPaymentStatus | null;
  calculation?: Array<any>;
} & LogFields &
  TimestampFields;
