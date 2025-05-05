import { DeliveryDirector, DeliveryPricingSheet } from '@unchainedshop/core';
import { Context } from '../../../context.js';
import { DeliveryLocation, DeliveryProvider } from '@unchainedshop/core-delivery';
import { OrderDelivery, OrderDeliveryDiscount } from '@unchainedshop/core-orders';

type HelperType<T> = (orderDelivery: OrderDelivery, _: never, context: Context) => T;

export interface OrderDeliveryPickupHelperTypes {
  activePickUpLocation: HelperType<Promise<DeliveryLocation>>;
  discounts: HelperType<Promise<OrderDeliveryDiscount[]>>;
  pickUpLocations: HelperType<Promise<DeliveryLocation[]>>;
  provider: HelperType<Promise<DeliveryProvider>>;
  status: HelperType<string>;
}

export const OrderDeliveryPickUp: OrderDeliveryPickupHelperTypes = {
  activePickUpLocation: async (orderDelivery, _, requestContext) => {
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

  pickUpLocations: async (obj, _, context) => {
    const provider = await context.loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj.deliveryProviderId,
    });
    const director = await DeliveryDirector.actions(provider, { orderDelivery: obj }, context);

    return director.pickUpLocations();
  },

  provider: async (obj, _, { loaders }) => {
    return loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj.deliveryProviderId,
    });
  },

  status: (obj, _, { modules }) => {
    return modules.orders.deliveries.normalizedStatus(obj);
  },

  discounts: async (obj, _, context) => {
    const { modules } = context;
    // TODO: use order loader
    const order = await modules.orders.findOrder({ orderId: obj.orderId });

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
