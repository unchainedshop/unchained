import { DeliveryDirector } from '@unchainedshop/core';
import type { Context } from '../../context.ts';

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
    const { loaders, services, countryCode, user } = context;
    const { currencyCode: forcedCurrencyCode, orderId, useNetPrice, context: providerContext } = args;

    const order = await loaders.orderLoader.load({ orderId });
    if (!order || !user) return null;

    const currencyCode = forcedCurrencyCode || order.currencyCode || context.currencyCode;

    return services.delivery.simulateDeliveryPricing(
      {
        countryCode,
        currencyCode,
        provider: deliveryProvider,
        order,
        providerContext,
        user,
      },
      { useNetPrice },
    );
  },
};
