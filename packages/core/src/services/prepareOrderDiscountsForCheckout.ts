import type { Order } from '@unchainedshop/core-orders';
import { OrderDiscountDirector } from '../directors/OrderDiscountDirector.ts';
import type { Modules } from '../modules.ts';

export async function prepareOrderDiscountsForCheckout(this: Modules, order: Order) {
  const reservations: { release: () => Promise<void> }[] = [];
  const release = async () => {
    await Promise.all(reservations.map((reservation) => reservation.release()));
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
