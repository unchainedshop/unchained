import { Context } from '../../context.js';
import { DeliveryProvider as DeliveryProviderType } from '@unchainedshop/core-delivery';
import { DeliveryDirector, DeliveryError, DeliveryPricingDirector } from '@unchainedshop/core';

export type HelperType<P, T> = (provider: DeliveryProviderType, params: P, context: Context) => T;

export interface DeliveryProviderHelperTypes {
  interface: HelperType<
    never,
    {
      _id: string;
      label: string;
      version: string;
    }
  >;
  isActive: HelperType<void, Promise<boolean>>;
  configurationError: HelperType<never, Promise<DeliveryError>>;
  simulatedPrice: HelperType<
    {
      currencyCode?: string;
      orderId: string;
      useNetPrice?: boolean;
      context: any;
    },
    Promise<{
      amount: number;
      currencyCode: string;
      countryCode: string;
      isTaxable: boolean;
      isNetPrice: boolean;
    }>
  >;
}

export const DeliveryProvider: DeliveryProviderHelperTypes = {
  interface(deliveryProvider) {
    const Adapter = DeliveryDirector.getAdapter(deliveryProvider.adapterKey);
    if (!Adapter) return null;
    return {
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    };
  },

  async isActive(deliveryProvider, _, requestContext) {
    const director = await DeliveryDirector.actions(deliveryProvider, {}, requestContext);
    return Boolean(director.isActive());
  },

  async configurationError(deliveryProvider, _, requestContext) {
    const director = await DeliveryDirector.actions(deliveryProvider, {}, requestContext);
    return director.configurationError();
  },

  async simulatedPrice(
    deliveryProvider,
    { currencyCode: forcedCurrencyCode, orderId, useNetPrice, context: providerContext },
    requestContext,
  ) {
    const { modules, countryCode, user } = requestContext;

    // TODO: use order loader
    const order = await modules.orders.findOrder({ orderId });
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
