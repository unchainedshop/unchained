import { Context } from '@unchainedshop/types/api';
import {
  OrderPayment,
  OrderPaymentDiscount,
} from '@unchainedshop/types/orders.payments';

type HelperType<P, T> = (
  orderPayment: OrderPayment,
  params: P,
  context: Context
) => T;

interface OrderPaymentCardHelperTypes {
  status: HelperType<never, string>;
  discounts: HelperType<never, Promise<Array<OrderPaymentDiscount>>>;
}

export const OrderPaymentCard: OrderPaymentCardHelperTypes = {
  status: (obj, _, { modules }) => {
    return modules.orders.payments.normalizedStatus(obj);
  },

  discounts: async (obj, _, { modules }) => {
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricingSheet = modules.orders.payments.pricingSheet(
      obj,
      order.currency
    );
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
