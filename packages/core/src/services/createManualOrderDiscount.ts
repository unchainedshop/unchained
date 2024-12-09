import { Order, OrderDiscount } from '@unchainedshop/core-orders';
import { OrderDiscountDirector } from '../directors/OrderDiscountDirector.js';
import { Modules } from '../modules.js';

export const createManualOrderDiscountService = async (
  { order, code }: { code: string; order: Order },
  unchainedAPI: { modules: Modules },
): Promise<OrderDiscount> => {
  const { modules } = unchainedAPI;

  // Use an already existing discount if available!
  const spareDiscount = await modules.orders.discounts.findSpareDiscount({ code });
  if (spareDiscount) {
    const Adapter = OrderDiscountDirector.getAdapter(spareDiscount.discountKey);
    if (!Adapter) return null;

    const actions = await Adapter.actions({
      context: { order, orderDiscount: spareDiscount, code, ...unchainedAPI },
    });
    const reservation = await actions.reserve({
      code,
    });

    return modules.orders.discounts.update(spareDiscount._id, { orderId: order._id, reservation });
  }

  const director = await OrderDiscountDirector.actions({ order, code }, unchainedAPI);
  const Adapter = await director.resolveDiscountAdapterFromStaticCode({
    code,
  });

  if (!Adapter) return null;

  const newDiscount = await modules.orders.discounts.create({
    orderId: order._id,
    code,
    discountKey: Adapter.key,
  });

  const adapter = await Adapter.actions({
    context: { order, orderDiscount: newDiscount, code: newDiscount.code, ...unchainedAPI },
  });

  try {
    const reservation = await adapter.reserve({
      code: newDiscount.code,
    });
    const reservedDiscount = modules.orders.discounts.update(newDiscount._id, {
      orderId: newDiscount.orderId,
      reservation,
    });
    return reservedDiscount;
  } catch (error) {
    await adapter.release();
    await modules.orders.discounts.delete(newDiscount._id);
    throw error;
  }
};
