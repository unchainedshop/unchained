import { DeliveryDirector, DeliveryPricingSheet } from '@unchainedshop/core';
import type { Context } from '../../../context.ts';
import type { OrderDelivery } from '@unchainedshop/core-orders';

export const OrderDeliveryPickUp = {
  async activePickUpLocation(orderDelivery: OrderDelivery, _: never, requestContext: Context) {
    const { orderPickUpLocationId } = orderDelivery.context || {};

    const provider = await requestContext.loaders.deliveryProviderLoader.load({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    });
    const director = await DeliveryDirector.actions(
      provider,
      { orderDelivery: orderDelivery },
      requestContext,
    );

    return director.pickUpLocationById(orderPickUpLocationId);
  },

  async pickUpLocations(obj: OrderDelivery, _: never, context: Context) {
    const provider = await context.loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj.deliveryProviderId,
    });
    const director = await DeliveryDirector.actions(provider, { orderDelivery: obj }, context);

    return director.pickUpLocations();
  },

  async provider(obj: OrderDelivery, _: never, { loaders }: Context) {
    return loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj.deliveryProviderId,
    });
  },

  status(obj: OrderDelivery, _: never, { modules }: Context) {
    return modules.orders.deliveries.normalizedStatus(obj);
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
