import crypto from 'crypto';
import { Context } from '../../../context.js';
import { PaymentError, PaymentProvider as PaymentProviderType } from '@unchainedshop/core-payment';
import { PaymentPricingDirector } from '@unchainedshop/core-payment';

export interface PaymentProviderHelperTypes {
  interface: (
    provider: PaymentProviderType,
    _: never,
    context: Context,
  ) => {
    _id: string;
    label: string;
    version: string;
  };
  isActive: (provider: PaymentProviderType, _: never, context: Context) => Promise<boolean>;
  configurationError: (
    provider: PaymentProviderType,
    _: never,
    context: Context,
  ) => Promise<PaymentError>;
  simulatedPrice: (
    provider: PaymentProviderType,
    params: {
      currency?: string;
      orderId: string;
      useNetPrice?: boolean;
      context: any;
    },
    context: Context,
  ) => Promise<{
    _id: string;
    amount: number;
    currencyCode: string;
    countryCode: string;
    isTaxable: boolean;
    isNetPrice: boolean;
  }>;
}
export const PaymentProvider: PaymentProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.payment.paymentProviders.findInterface(obj);
    if (!Interface) return null;
    return Interface;
  },

  configurationError(obj, _, requestContext) {
    const { modules } = requestContext;
    return modules.payment.paymentProviders.configurationError(obj, requestContext);
  },

  isActive(obj, _, requestContext) {
    const { modules } = requestContext;
    return modules.payment.paymentProviders.isActive(obj, requestContext);
  },

  async simulatedPrice(
    paymentProvider,
    { currency: currencyCode, orderId, useNetPrice, context: providerContext },
    requestContext,
  ) {
    const { modules, countryContext: country, user } = requestContext;
    const order = await modules.orders.findOrder({ orderId });
    const currency = currencyCode || order?.currency || requestContext.currencyContext;
    const pricingContext = {
      country,
      currency,
      provider: paymentProvider,
      order,
      providerContext,
      user,
    };

    const calculated = await PaymentPricingDirector.rebuildCalculation(pricingContext, requestContext);

    if (!calculated || !calculated.length) return null;

    const pricing = PaymentPricingDirector.calculationSheet(pricingContext, calculated);

    const orderPrice = pricing.total({ useNetPrice }) as {
      amount: number;
      currency: string;
    };

    return {
      _id: crypto
        .createHash('sha256')
        .update([paymentProvider._id, country, useNetPrice, order ? order._id : ''].join(''))
        .digest('hex'),
      amount: orderPrice.amount,
      currencyCode: orderPrice.currency,
      countryCode: country,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
};
