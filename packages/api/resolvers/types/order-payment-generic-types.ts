import { Context } from '@unchainedshop/types/api';
import {
  OrderPayment,
  OrderPaymentDiscount,
} from '@unchainedshop/types/orders.payments';
import { OrderPaymentConfigurationError } from '../../errors';

type HelperType<P, T> = (
  orderPayment: OrderPayment,
  params: P,
  context: Context
) => T;

interface OrderPaymentGenericHelperTypes {
  status: HelperType<never, string>;
  sign: HelperType<{ transactionContext: any }, Promise<string>>;
  discounts: HelperType<never, Array<OrderPaymentDiscount>>;
}

export const OrderPaymentGeneric: OrderPaymentGenericHelperTypes = {
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

  sign: async (obj, { transactionContext }, context) => {
    try {
      return await context.modules.orders.payments.sign(
        obj,
        transactionContext,
        context
      );
    } catch (error) {
      throw new OrderPaymentConfigurationError(error);
    }
  },
};
