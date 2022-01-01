import { Context } from '@unchainedshop/types/api';
import { Address } from '@unchainedshop/types/common';
import {
  OrderDelivery,
  OrderDeliveryDiscount,
} from '@unchainedshop/types/orders.deliveries';

type HelperType<T> = (
  orderDelivery: OrderDelivery,
  _: never,
  context: Context
) => T;

interface OrderDeliveryShippingHelperTypes {
  address: HelperType<Address>;
  status: HelperType<string>;
  discounts: HelperType<Array<OrderDeliveryDiscount>>;
}

export const OrderDeliveryShipping: OrderDeliveryShippingHelperTypes = {
  address: (obj) => {
    return obj.context?.address;
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
