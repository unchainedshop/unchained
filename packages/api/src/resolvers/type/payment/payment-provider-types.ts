import { Context } from '../../../context.js';
import { PaymentProvider as PaymentProviderType } from '@unchainedshop/core-payment';
import { PaymentDirector, PaymentPricingDirector } from '@unchainedshop/core';

export const PaymentProvider = {
  interface(provider: PaymentProviderType) {
    const Adapter = PaymentDirector.getAdapter(provider.adapterKey);
    if (!Adapter) return null;
    return {
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    };
  },

  async configurationError(paymentProvider: PaymentProviderType, _, requestContext: Context) {
    const adapter = await PaymentDirector.actions(paymentProvider, {}, requestContext);
    return adapter.configurationError();
  },

  async isActive(paymentProvider: PaymentProviderType, _, requestContext: Context) {
    const adapter = await PaymentDirector.actions(paymentProvider, {}, requestContext);
    return adapter.isActive();
  },

  async simulatedPrice(
    paymentProvider: PaymentProviderType,
    { currency: currencyCode, orderId, useNetPrice, context: providerContext },
    requestContext: Context,
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
      amount: orderPrice.amount,
      currencyCode: orderPrice.currency,
      countryCode: country,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
};
