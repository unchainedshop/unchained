import {
  Address,
  Contact,
  FindOptions,
  LogFields,
  ModuleMutations,
  TimestampFields,
  Update,
  _ID,
} from './common';
import { OrderDeliveriesModule } from './orders.deliveries';
import { OrderPositionsModule } from './orders.positions';
import { OrderPaymentsModule } from './orders.payments';
import { User } from './user';
import { OrderDiscountModule } from './orders.discount';

export enum OrderStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULLFILLED = 'FULLFILLED',
}

export type Order = {
  _id?: _ID;
  billingAddress?: Address;
  calculation: Array<any>;
  confirmed?: Date;
  contact?: Contact;
  context?: any;
  countryCode: string;
  currency: string;
  deliveryId?: string;
  fullfilled?: Date;
  orderCode?: string;
  ordered?: Date;
  orderNumber?: string;
  originEnrollmentId?: string;
  paymentId?: string;
  status: OrderStatus | null;
  userId: string;
} & LogFields &
  TimestampFields;

type OrderQuery = {
  includeCarts?: boolean;
  queryString?: string;
};

export type OrdersModule = ModuleMutations<Order> & {
  // Queries
  findOrder: (params: {
    orderId?: string;
    orderNumber?: string;
  }) => Promise<Order>;
  findOrders: (
    params: OrderQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions
  ) => Promise<Array<Order>>;
  count: (query: OrderQuery) => Promise<number>;
  orderExists: (params: { orderId: string }) => Promise<boolean>;

  // Transformations
  normalizedStatus: (order: Order) => string;
  nextStatus: (order: Order) => Promise<OrderStatus>;
  isCart: (order: Order) => boolean;
  cart: (
    order: { countryContext?: string; orderNumber?: string },
    user: User
  ) => Promise<Order>;

  // Checkout
  checkout: (
    order: Order,
    params: { paymentContext?: any; deliveryContext?: any; orderContext?: any },
    userId?: string
  ) => Promise<Order>;
  confirm: (
    order: Order,
    params: { paymentContext?: any; deliveryContext?: any; orderContext?: any },
    userId?: string
  ) => Promise<Order>;
  processOrder: (
    order: Order,
    params: { paymentContext?: any; deliveryContext?: any; orderContext?: any },
    userId?: string
  ) => Promise<Order>;

  // Mutations
  create: (
    doc: { orderNumber?: string; currency: string; countryCode: string },
    user: User
  ) => Promise<Order>;
  update: (_id: _ID, doc: Update<Order>, userId?: string) => Promise<Order>;

  setDeliveryProvider: (
    _id: _ID,
    deliveryProviderId: string,
    userId?: string
  ) => Promise<Order>;
  setPaymentProvider: (
    _id: _ID,
    paymentProviderId: string,
    userId?: string
  ) => Promise<Order>;

  updateBillingAddress: (
    _id: _ID,
    billingAddress: Address,
    userId?: string
  ) => Promise<Order>;
  updateContact: (
    _id: _ID,
    contact: Contact,
    userId?: string
  ) => Promise<Order>;
  updateContext: (_id: _ID, context: any, userId?: string) => Promise<Order>;

  updateStatus: (
    _id: _ID,
    params: { status: OrderStatus; info?: string },
    userId?: string
  ) => Promise<Order>;

  updateCalculation: (_id: _ID) => Promise<boolean>;

  /*
   * Sub entities
   */

  deliveries: OrderDeliveriesModule;
  discount: OrderDiscountModule;
  positions: OrderPositionsModule;
  payments: OrderPaymentsModule;
};
