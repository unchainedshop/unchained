import { Context } from '@unchainedshop/types/api';
import { Order as OrderType } from '@unchainedshop/types/orders';
import crypto from 'crypto';
import { OrderPricingSheet } from 'meteor/unchained:utils';
// import { Currencies } from 'meteor/unchained:core-currencies';
// import { DeliveryProviders } from 'meteor/unchained:core-delivery';
// import { PaymentProviders } from 'meteor/unchained:core-payment';

interface OrderHelperTypes {}

export const Order = {
  supportedDeliveryProviders: async (
    obj: OrderType,
    _: never,
    { modules }: Context
  ) => {
    return modules.delivery.findSupported({
      order: obj,
    });
  },

  supportedPaymentProviders: async (
    obj: OrderType,
    _: never,
    context: Context
  ) => {
    return context.modules.payment.paymentProviders.findSupported(
      {
        order: obj,
      },
      context
    );
  },

  status: (obj: OrderType, _: never, { modules }: Context) => {
    return modules.orders.normalizedStatus(obj);
  },

  total: async (
    obj: OrderType,
    params: { category: string },
    { modules }: Context
  ) => {
    const price = modules.orders.pricingSheet(obj).total(params.category);

    return {
      _id: crypto
        .createHash('sha256')
        .update([obj._id, price.amount, price.currency].join(''))
        .digest('hex'),
      ...price,
    };
  },

  currency: async (obj: OrderType, _: never, { modules }: Context) => {
    return await modules.currencies.findCurrency({ isoCode: obj.currency });
  },
};
