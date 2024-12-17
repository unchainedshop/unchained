import { Order, OrderStatus } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';
import { processOrderService } from './processOrder.js';

export async function confirmOrderService(
  this: Modules,
  order: Order,
  transactionContext: {
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
    nextStatus?: OrderStatus;
  },
) {
  if (order.status !== OrderStatus.PENDING) return order;

  const lock = await this.orders.acquireLock(order._id, 'confirm-reject', 1500);
  try {
    return await processOrderService.bind(this)(order, {
      ...transactionContext,
      nextStatus: OrderStatus.CONFIRMED,
    });
  } finally {
    await lock.release();
  }
}
