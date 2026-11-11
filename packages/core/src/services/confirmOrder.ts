import { type Order, OrderStatus } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { processOrderService } from './processOrder.ts';
import { lockOrderSupply } from './lockOrderSupply.ts';

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
  const lockedOrder = await this.orders.findOrder({ orderId: order._id });
  if (lockedOrder?.status !== OrderStatus.PENDING) return lockedOrder;
  await using supplyLocks = await lockOrderSupply.call(this, lockedOrder);

  return await processOrderService.bind(this)(lockedOrder, {
    ...transactionContext,
    nextStatus: OrderStatus.CONFIRMED,
  });
}
