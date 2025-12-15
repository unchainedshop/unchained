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

  async simulatedPrice(deliveryProvider, args, requestContext: Context) {
    const { loaders, services, countryCode, user } = requestContext;
    const { currencyCode: forcedCurrencyCode, orderId, useNetPrice, context: providerContext } = args;

    if (!user) return null;

    const order = orderId ? await loaders.orderLoader.load({ orderId }) : undefined;
    const currencyCode = forcedCurrencyCode || order?.currencyCode || requestContext.currencyCode;

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
