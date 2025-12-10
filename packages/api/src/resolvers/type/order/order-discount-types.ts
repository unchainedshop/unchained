import type { Context } from '../../../context.ts';
import type { OrderDiscount as OrderDiscountType } from '@unchainedshop/core-orders';
import { OrderDiscountDirector } from '@unchainedshop/core';

export const OrderDiscount = {
  async interface(obj: OrderDiscountType) {
    const Interface = OrderDiscountDirector.getAdapter(obj.discountKey);
    if (!Interface) return null;

    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
      isManualAdditionAllowed: await Interface.isManualAdditionAllowed(obj.code),
      isManualRemovalAllowed: await Interface.isManualRemovalAllowed(),
    };
  },

  async order(obj: OrderDiscountType, _: never, { loaders }: Context) {
    return loaders.orderLoader.load({ orderId: obj.orderId });
  },

  async total(obj: OrderDiscountType, _: never, { loaders, services }: Context) {
    const order = await loaders.orderLoader.load({ orderId: obj.orderId });
    return services.orders.calculateDiscountTotal(order, obj);
  },

  async discounted(obj: OrderDiscountType, _: never, { loaders, services }: Context) {
    const order = await loaders.orderLoader.load({ orderId: obj.orderId });
    return services.orders.discountedEntities(order, obj);
  },
};
