import { type Order, OrderStatus } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { processOrderService } from './processOrder.ts';

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

  await using lock = await this.orders.acquireLock(order._id, 'confirm-reject');
  return await processOrderService.bind(this)(order, {
    ...transactionContext,
    nextStatus: OrderStatus.CONFIRMED,
  });
}
