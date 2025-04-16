import { PaymentPricingSheet } from '@unchainedshop/core';
import { Context } from '../../../context.js';
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
    // TODO: use loader
    return modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });
  },

  discounts: async (obj, _, context) => {
    const { modules } = context;

    // TODO: use loader
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricing = PaymentPricingSheet({
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
