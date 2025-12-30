import { type Order, OrderStatus, type OrderStatusType } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { processOrderService } from './processOrder.ts';

export async function confirmOrderService(
  this: Modules,
  order: Order,
  transactionContext: {
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
    nextStatus?: OrderStatusType;
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
