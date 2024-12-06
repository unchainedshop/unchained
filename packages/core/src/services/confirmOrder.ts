import { Order, OrderStatus } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';
import { processOrderService } from './processOrder.js';

export const confirmOrderService = async (
  order: Order,
  transactionContext: {
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
    nextStatus?: OrderStatus;
  },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;

  if (order.status !== OrderStatus.PENDING) return order;

  const lock = await modules.orders.acquireLock(order._id, 'confirm-reject', 1500);
  try {
    return await processOrderService(
      order,
      {
        ...transactionContext,
        nextStatus: OrderStatus.CONFIRMED,
      },
      unchainedAPI,
    );
  } finally {
    await lock.release();
  }
};
