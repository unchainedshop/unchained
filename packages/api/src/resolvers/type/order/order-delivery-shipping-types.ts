import { DeliveryPricingSheet } from '@unchainedshop/core';
import { Context } from '../../../context.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { OrderDelivery, OrderDeliveryDiscount } from '@unchainedshop/core-orders';
import { Address } from '@unchainedshop/mongodb';

type HelperType<T> = (orderDelivery: OrderDelivery, _: never, context: Context) => T;

export interface OrderDeliveryShippingHelperTypes {
  address: HelperType<Address>;
  discounts: HelperType<Promise<Array<OrderDeliveryDiscount>>>;
  provider: HelperType<Promise<DeliveryProvider>>;
  status: HelperType<string>;
}

export const OrderDeliveryShipping: OrderDeliveryShippingHelperTypes = {
  address: (obj) => {
    return obj.context?.address;
  },

  status: (obj, _, { modules }) => {
    return modules.orders.deliveries.normalizedStatus(obj);
  },

  provider: async (obj, _, { modules }) => {
    // TODO: use loader
    return modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });
  },

  discounts: async (obj, _, context) => {
    const { modules } = context;
    // TODO: use loader
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricing = DeliveryPricingSheet({
      calculation: obj.calculation,
      currency: order.currency,
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
