import { DeliveryPricingSheet } from '@unchainedshop/core';
import type { Context } from '../../../context.ts';
import type { OrderDelivery } from '@unchainedshop/core-orders';

export const OrderDeliveryShipping = {
  async fee(obj: OrderDelivery, _: never, { loaders }: Context) {
    const order = await loaders.orderLoader.load({ orderId: obj.orderId });
    const pricing = DeliveryPricingSheet({
      calculation: obj.calculation,
      currencyCode: order.currencyCode,
    });
    if (!pricing.isValid()) return null;
    return { ...pricing.total(), isTaxable: pricing.taxSum() !== 0, isNetPrice: false };
  },

  address(obj: OrderDelivery) {
    return obj.context?.address;
  },

  status(obj: OrderDelivery, _: never, { modules }: Context) {
    return modules.orders.deliveries.normalizedStatus(obj);
  },

  async provider(obj: OrderDelivery, _: never, { loaders }: Context) {
    return loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj.deliveryProviderId,
    });
  },

  async discounts(obj: OrderDelivery, _: never, { loaders }: Context) {
    const order = await loaders.orderLoader.load({ orderId: obj.orderId });
    const pricing = DeliveryPricingSheet({
      calculation: obj.calculation,
      currencyCode: order.currencyCode,
    });
    if (pricing.isValid()) {
      // IMPORTANT: Do not send any parameter to obj.discounts!
      return pricing.discountPrices().map((discount) => ({
        item: obj,
        ...discount,
      }));
    }
    return [];
  },
};
