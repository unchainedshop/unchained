import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';
import { Order } from '@unchainedshop/types/orders';

export const OrdersCollection = async (db: Db) => {
  const Orders = db.collection<Order>('orders');

  // Order Indexes
  await buildDbIndexes<Order>(Orders, [
    { index: { userId: 1 } },
    { index: { status: 1 } },
    { index: { orderNumber: 1 } },
    {
      index: {
        _id: 'text',
        userId: 'text',
        orderNumber: 'text',
        status: 'text',
      },
      options: {
        weights: {
          _id: 8,
          userId: 3,
          orderNumber: 6,
          status: 1,
        },
        name: 'order_fulltext_search',
      },
    },
  ]);

  return Orders;
};
