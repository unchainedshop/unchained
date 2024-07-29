import { Context } from '@unchainedshop/api';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { OrderDelivery, OrderDeliveryDiscount } from '@unchainedshop/core-orders';
import type { Address } from '@unchainedshop/mongodb';

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
    return modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });
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
