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
    { currencyCode: forcedCurrencyCode, orderId, useNetPrice, context: providerContext },
    requestContext: Context,
  ) {
    const { loaders, countryCode, user } = requestContext;

    const order = await loaders.orderLoader.load({ orderId })
    const currencyCode = forcedCurrencyCode || order?.currencyCode || requestContext.currencyCode;
    const pricingContext = {
      countryCode,
      currencyCode,
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
      currencyCode: string;
    };

    return {
      amount: orderPrice.amount,
      currencyCode: orderPrice.currencyCode,
      countryCode,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
};
