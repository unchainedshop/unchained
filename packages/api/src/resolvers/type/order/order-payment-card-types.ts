import { PaymentPricingSheet } from '@unchainedshop/core';
import { Context } from '../../../context.js';
import { OrderPayment } from '@unchainedshop/core-orders';

export const OrderPaymentCard = {
  status(obj: OrderPayment, _: never, { modules }: Context) {
    return modules.orders.payments.normalizedStatus(obj);
  },

  async provider(obj: OrderPayment, _: never, { loaders }: Context) {
    return loaders.paymentProviderLoader.load({
      paymentProviderId: obj.paymentProviderId,
    });
  },

  async discounts(obj: OrderPayment, _: never, { loaders }: Context) {
    const order = await loaders.orderLoader.load({ orderId: obj.orderId });
    const pricing = PaymentPricingSheet({
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
