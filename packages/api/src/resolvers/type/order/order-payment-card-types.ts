import { Context } from '@unchainedshop/api';
import { OrderPayment, OrderPaymentDiscount } from '@unchainedshop/core-orders';
import { PaymentProvider } from '@unchainedshop/core-payment';

type HelperType<T> = (orderPayment: OrderPayment, _: never, context: Context) => T;

export interface OrderPaymentCardHelperTypes {
  discounts: HelperType<Promise<Array<OrderPaymentDiscount>>>;
  provider: HelperType<Promise<PaymentProvider>>;
  status: HelperType<string>;
}

export const OrderPaymentCard: OrderPaymentCardHelperTypes = {
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
    const pricingSheet = modules.orders.payments.pricingSheet(obj, order.currency, context);
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
