import { Context } from '../../context.js';
import { DeliveryProvider as DeliveryProviderType } from '@unchainedshop/core-delivery';
import { DeliveryDirector, DeliveryPricingDirector } from '@unchainedshop/core';

export const DeliveryProvider = {
  interface(deliveryProvider: DeliveryProviderType) {
    const Adapter = DeliveryDirector.getAdapter(deliveryProvider.adapterKey);
    if (!Adapter) return null;
    return {
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    };
  },

  async isActive(deliveryProvider: DeliveryProviderType, _: never, requestContext: Context) {
    const director = await DeliveryDirector.actions(deliveryProvider, {}, requestContext);
    return Boolean(director.isActive());
  },

  async configurationError(deliveryProvider: DeliveryProviderType, _: never, requestContext: Context) {
    const director = await DeliveryDirector.actions(deliveryProvider, {}, requestContext);
    return director.configurationError();
  },

  async simulatedPrice(
    deliveryProvider: DeliveryProviderType,
    { currencyCode: forcedCurrencyCode, orderId, useNetPrice, context: providerContext }: {
      currencyCode?: string;
      orderId: string;
      useNetPrice?: boolean;
      context: any;
    },
    requestContext: Context,
  ) {
    const { loaders, countryCode, user } = requestContext;

    const order = await loaders.orderLoader.load({ orderId });
    const currencyCode = forcedCurrencyCode || order?.currencyCode || requestContext.currencyCode;
    const pricingContext = {
      countryCode,
      currencyCode,
      provider: deliveryProvider,
      order,
      providerContext,
      user,
    };

    const calculated = await DeliveryPricingDirector.rebuildCalculation(pricingContext, requestContext);

    if (!calculated || !calculated.length) return null;

    const pricing = DeliveryPricingDirector.calculationSheet(pricingContext, calculated);

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
