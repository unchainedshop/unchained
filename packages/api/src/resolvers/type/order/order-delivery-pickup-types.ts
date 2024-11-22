import { Context } from '../../../context.js';
import { DeliveryLocation, DeliveryProvider } from '@unchainedshop/core-delivery';
import { OrderDelivery, OrderDeliveryDiscount } from '@unchainedshop/core-orders';
import { DeliveryDirector } from '@unchainedshop/core-delivery';

type HelperType<T> = (orderDelivery: OrderDelivery, _: never, context: Context) => T;

export interface OrderDeliveryPickupHelperTypes {
  activePickUpLocation: HelperType<Promise<DeliveryLocation>>;
  discounts: HelperType<Promise<Array<OrderDeliveryDiscount>>>;
  pickUpLocations: HelperType<Promise<Array<DeliveryLocation>>>;
  provider: HelperType<Promise<DeliveryProvider>>;
  status: HelperType<string>;
}

export const OrderDeliveryPickUp: OrderDeliveryPickupHelperTypes = {
  activePickUpLocation: async (obj, _, context) => {
    const { modules } = context;
    return modules.orders.deliveries.activePickUpLocation(obj, context);
  },

  pickUpLocations: async (obj, _, context) => {
    const provider = await context.modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });
    const director = await DeliveryDirector.actions(provider, { orderDelivery: obj }, context);

    return director.pickUpLocations();
  },

  provider: async (obj, _, { modules }) => {
    return modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });
  },

  status: (obj, _, { modules }) => {
    return modules.orders.deliveries.normalizedStatus(obj);
  },

  discounts: async (obj, _, context) => {
    const { modules } = context;
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricingSheet = modules.orders.deliveries.pricingSheet(obj, order.currency, context);
    if (pricingSheet.isValid()) {
      // IMPORTANT: Do not send any parameter to obj.discounts!
      return pricingSheet.discountPrices().map((discount) => ({
        item: obj,
        ...discount,
      }));
    }
    return [];
  },
};
