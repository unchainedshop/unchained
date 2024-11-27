import { Context } from '../../../context.js';
import { OrderPayment, OrderPaymentDiscount } from '@unchainedshop/core-orders';
import { PaymentProvider } from '@unchainedshop/core-payment';

type HelperType<P, T> = (orderPayment: OrderPayment, params: P, context: Context) => T;

export interface OrderPaymentGenericHelperTypes {
  discounts: HelperType<never, Promise<Array<OrderPaymentDiscount>>>;
  provider: HelperType<never, Promise<PaymentProvider>>;
  status: HelperType<never, string>;
}

export const OrderPaymentGeneric: OrderPaymentGenericHelperTypes = {
  status: (obj, _, { modules }) => {
    return modules.orders.payments.normalizedStatus(obj);
  },

  provider: async (obj, _, { modules }) => {
    return modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });
  },

  discounts: async (obj, _, context) => {
    const { modules } = context;
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricingSheet = modules.orders.payments.pricingSheet(obj, order.currency);
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
