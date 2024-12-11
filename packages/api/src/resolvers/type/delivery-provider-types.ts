import crypto from 'crypto';
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
      currency?: string;
      orderId: string;
      useNetPrice?: boolean;
      context: any;
    },
    Promise<{
      _id: string;
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
    { currency: currencyCode, orderId, useNetPrice, context: providerContext },
    requestContext,
  ) {
    const { modules, countryContext: country, user } = requestContext;
    const order = await modules.orders.findOrder({ orderId });
    const currency = currencyCode || order?.currency || requestContext.currencyContext;
    const pricingContext = {
      country,
      currency,
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
      currency: string;
    };

    return {
      _id: crypto
        .createHash('sha256')
        .update([deliveryProvider._id, country, useNetPrice, order ? order._id : ''].join(''))
        .digest('hex'),
      amount: orderPrice.amount,
      currencyCode: orderPrice.currency,
      countryCode: country,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
};
