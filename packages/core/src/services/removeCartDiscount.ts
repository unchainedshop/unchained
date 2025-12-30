import type { Modules } from '../modules.ts';
import { OrderDiscountDirector } from '../directors/index.ts';
import { OrderDiscountTrigger, type Order, type OrderDiscount } from '@unchainedshop/core-orders';

export async function removeCartDiscountService(
  this: Modules,
  {
    order,
    orderDiscount,
    requestContext,
  }: {
    order: Order;
    orderDiscount: OrderDiscount;
    requestContext: {
      localeContext: Intl.Locale;
      userId?: string;
    };
  },
): Promise<OrderDiscount | null> {
  if (orderDiscount.trigger === OrderDiscountTrigger.USER) {
    const Adapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
    if (Adapter) {
      const adapter = await Adapter.actions({
        context: {
          order,
          orderDiscount,
          code: orderDiscount.code ?? undefined,
          modules: this,
          ...requestContext,
        },
      });
      await adapter.release();
    }
  }

  return this.orders.discounts.delete(orderDiscount._id);
}
