import { Context } from '@unchainedshop/types/api';
import { DeliveryLocation } from '@unchainedshop/types/delivery';
import {
  OrderDelivery,
  OrderDeliveryDiscount,
} from '@unchainedshop/types/orders.deliveries';
import { DeliveryDirector } from 'meteor/unchained:utils';

type HelperType<T> = (
  orderDelivery: OrderDelivery,
  _: never,
  context: Context
) => T;

interface OrderDeliveryPickupHelperTypes {
  activePickUpLocation: HelperType<Promise<DeliveryLocation>>;
  pickUpLocations: HelperType<Promise<Array<DeliveryLocation>>>;
  status: HelperType<string>;
  discounts: HelperType<Array<OrderDeliveryDiscount>>;
}

export const OrderDeliveryPickUp: OrderDeliveryPickupHelperTypes = {
  activePickUpLocation: async (obj, _, context) => {
    const { orderPickUpLocationId } = obj.context || {};
    const provider = await context.modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });
    const director = DeliveryDirector.actions(provider, {}, context);

    return await director.pickUpLocationById(orderPickUpLocationId);
  },

  pickUpLocations: async (obj, _, context) => {
    const provider = await context.modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });
    const director = DeliveryDirector.actions(provider, {}, context);

    return await director.pickUpLocations();
  },

  status: (obj, _, { modules }) => {
    return modules.orders.deliveries.normalizedStatus(obj);
  },

  discounts: (obj, _, { modules }) => {
    const pricingSheet = modules.orders.deliveries.pricingSheet(obj);
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
