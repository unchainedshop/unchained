import { DeliveryDirector, DeliveryPricingDirector } from '@unchainedshop/core';
import { Context } from '../../context.js';

export const DeliveryProviderInterface = {
  async isActive(deliveryProvider, _, context: Context) {
    const director = await DeliveryDirector.actions(deliveryProvider, {}, context);
    return Boolean(director.isActive());
  },

  async configurationError(deliveryProvider, _, context: Context) {
    const director = await DeliveryDirector.actions(deliveryProvider, {}, context);
    return director.configurationError();
  },

  interface(deliveryProvider) {
    const Adapter = DeliveryDirector.getAdapter(deliveryProvider.adapterKey);
    if (!Adapter) return null;
    return {
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    };
  },

  async simulatedPrice(deliveryProvider, args, context: Context) {
    const { loaders, countryCode, user } = context;
    const { currencyCode: forcedCurrencyCode, orderId, useNetPrice, context: providerContext } = args;

    const order = await loaders.orderLoader.load({ orderId });
    const currencyCode = forcedCurrencyCode || order?.currencyCode || context.currencyCode;

    const pricingContext = {
      countryCode,
      currencyCode,
      provider: deliveryProvider,
      order,
      providerContext,
      user: user!,
    };

    const calculated = await DeliveryPricingDirector.rebuildCalculation(pricingContext, context);
    if (!calculated?.length) return null;

    const pricing = DeliveryPricingDirector.calculationSheet(pricingContext, calculated);
    const orderPrice = pricing.total({ useNetPrice });

    return {
      amount: orderPrice.amount,
      currencyCode: orderPrice.currencyCode,
      countryCode,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
};
