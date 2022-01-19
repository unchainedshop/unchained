import { Context } from '@unchainedshop/types/api';
import {
  OrderPayment,
  OrderPaymentDiscount,
} from '@unchainedshop/types/orders.payments';
import { PaymentProvider } from '@unchainedshop/types/payments';

type HelperType<T> = (
  orderPayment: OrderPayment,
  _: never,
  context: Context
) => T;

interface OrderPaymentInvoiceHelperTypes {
  discounts: HelperType<Promise<Array<OrderPaymentDiscount>>>;
  provider: HelperType<Promise<PaymentProvider>>;
  status: HelperType<string>;
}

export const OrderPaymentInvoice: OrderPaymentInvoiceHelperTypes = {
  status: (obj, _, { modules }) => {
    return modules.orders.payments.normalizedStatus(obj);
  },

  provider: async (obj, _, { modules }) => {
    return await modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });
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
