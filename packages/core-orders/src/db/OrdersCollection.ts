import {
  mongodb,
  buildDbIndexes,
  Address,
  Contact,
  LogFields,
  TimestampFields,
  isDocumentDBCompatModeEnabled,
} from '@unchainedshop/mongodb';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULLFILLED = 'FULLFILLED',
  REJECTED = 'REJECTED',
}

export type Order = {
  _id?: string;
  billingAddress?: Address;
  calculation: any[];
  confirmed?: Date;
  rejected?: Date;
  contact?: Contact;
  context?: any;
  countryCode: string;
  currencyCode: string;
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

export interface OrderQuery extends mongodb.Filter<Order> {
  includeCarts?: boolean;
  queryString?: string;
  status?: OrderStatus[];
  userId?: string;
}

export const OrdersCollection = async (db: mongodb.Db) => {
  const Orders = db.collection<Order>('orders');

  // Order Indexes
  await buildDbIndexes<Order>(Orders, [
    { index: { userId: 1 } },
    { index: { status: 1 } },
    { index: { orderNumber: 1 } },
    !isDocumentDBCompatModeEnabled() && {
      index: {
        _id: 'text',
        userId: 'text',
        orderNumber: 'text',
        status: 'text',
        'contact.emailAddress': 'text',
        'contact.telNumber': 'text',
      } as any,
      options: {
        weights: {
          _id: 8,
          userId: 3,
          orderNumber: 6,
          'contact.telNumber': 5,
          'contact.emailAddress': 4,
          status: 1,
        },
        name: 'order_fulltext_search',
      },
    },
  ]);

  return Orders;
};
