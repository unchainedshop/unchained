import { Order, OrderDiscount } from '@unchainedshop/core-orders';
import { OrderDiscountDirector } from '../directors/OrderDiscountDirector.js';
import { Modules } from '../modules.js';

export async function createManualOrderDiscountService(
  this: Modules,
  { order, code }: { code: string; order: Order },
): Promise<OrderDiscount> {
  // Use an already existing discount if available!
  const spareDiscount = await this.orders.discounts.findSpareDiscount({ code });
  if (spareDiscount) {
    const Adapter = OrderDiscountDirector.getAdapter(spareDiscount.discountKey);
    if (!Adapter) return null;

    const actions = await Adapter.actions({
      context: { order, orderDiscount: spareDiscount, code, modules: this },
    });
    const reservation = await actions.reserve({
      code,
    });

    return this.orders.discounts.update(spareDiscount._id, { orderId: order._id, reservation });
  }

  const director = await OrderDiscountDirector.actions({ order, code }, { modules: this });
  const Adapter = await director.resolveDiscountAdapterFromStaticCode({
    code,
  });

  if (!Adapter) return null;

  const newDiscount = await this.orders.discounts.create({
    orderId: order._id,
    code,
    discountKey: Adapter.key,
  });

  const adapter = await Adapter.actions({
    context: { order, orderDiscount: newDiscount, code: newDiscount.code, modules: this },
  });

  try {
    const reservation = await adapter.reserve({
      code: newDiscount.code,
    });
    const reservedDiscount = this.orders.discounts.update(newDiscount._id, {
      orderId: newDiscount.orderId,
      reservation,
    });
    return reservedDiscount;
  } catch (error) {
    await adapter.release();
    await this.orders.discounts.delete(newDiscount._id);
    throw error;
  }
}
