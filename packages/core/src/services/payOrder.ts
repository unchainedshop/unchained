import type { Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { processOrderUnderLocks } from './processOrder.ts';

export async function payOrderService(this: Modules, order: Order) {
  return await processOrderUnderLocks.call(this, order, {}, async (lockedOrder: Order) => {
    const payment = await this.orders.payments.findOrderPayment({
      orderPaymentId: lockedOrder.paymentId!,
    });
    if (payment) await this.orders.payments.markAsPaid(payment, null);
  });
}
