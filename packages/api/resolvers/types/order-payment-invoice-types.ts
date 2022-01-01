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

interface OrderPaymentInvoiceHelperTypes {
  status: HelperType<never, string>;
  discounts: HelperType<never, Array<OrderPaymentDiscount>>;
}

export const OrderPaymentInvoice: OrderPaymentInvoiceHelperTypes = {
  status: (obj, _, { modules }) => {
    return modules.orders.payments.normalizedStatus(obj);
  },

  discounts: (obj, _, { modules }) => {
    const pricingSheet = modules.orders.payments.pricingSheet(obj);
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
