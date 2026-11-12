import type { Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { processOrderUnderLocks } from './processOrder.ts';

export async function deliverOrderService(this: Modules, order: Order) {
  return await processOrderUnderLocks.call(this, order, {}, async (lockedOrder: Order) => {
    const delivery = await this.orders.deliveries.findDelivery({
      orderDeliveryId: lockedOrder.deliveryId!,
    });
    if (delivery) await this.orders.deliveries.markAsDelivered(delivery);
  });
}
