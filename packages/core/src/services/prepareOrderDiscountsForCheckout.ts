import type { Order } from '@unchainedshop/core-orders';
import { createLogger } from '@unchainedshop/logger';
import { OrderDiscountDirector } from '../directors/OrderDiscountDirector.ts';
import type { Modules } from '../modules.ts';

const logger = createLogger('unchained:core:checkoutOrder');

/**
 * Lets discount adapters reserve scarce credit before payment starts. The returned release
 * never throws: reservations only guard the window until the order status is persisted, and
 * a failed release must not turn a completed checkout into an error.
 */
export async function prepareOrderDiscountsForCheckout(this: Modules, order: Order) {
  const reservations: { release: () => Promise<void> }[] = [];
  const release = async () => {
    const results = await Promise.allSettled(reservations.map((reservation) => reservation.release()));
    for (const result of results) {
      if (result.status === 'rejected') {
        logger.error(`Could not release a discount reservation of order ${order._id}`, {
          error: result.reason,
        });
      }
    }
  };
  try {
    const discounts = await this.orders.discounts.findOrderDiscounts({ orderId: order._id });
    for (const orderDiscount of discounts) {
      const Adapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
      if (!Adapter) continue;
      const adapter = await Adapter.actions({
        context: { order, orderDiscount, code: orderDiscount.code, modules: this },
      });
      if (adapter.prepareForCheckout) reservations.push(await adapter.prepareForCheckout());
    }
    return { release };
  } catch (error) {
    await release();
    throw error;
  }
}
