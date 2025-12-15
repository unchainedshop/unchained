import type { Context } from '../../../context.ts';
import type { PaymentProvider as PaymentProviderType } from '@unchainedshop/core-payment';
import { PaymentDirector } from '@unchainedshop/core';

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
    { currencyCode: forcedCurrencyCode, orderId, useNetPrice, context: providerContext },
    requestContext: Context,
  ) {
    const { loaders, services, countryCode, user } = requestContext;

    const order = await loaders.orderLoader.load({ orderId });
    if (!order || !user) return null;

    const currencyCode = forcedCurrencyCode || order.currencyCode || requestContext.currencyCode;

    return services.payment.simulatePaymentPricing(
      {
        countryCode,
        currencyCode,
        provider: paymentProvider,
        order,
        providerContext,
        user,
      },
      { useNetPrice },
    );
  },
};
