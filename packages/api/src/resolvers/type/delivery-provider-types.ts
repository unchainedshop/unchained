import crypto from 'crypto';
import { Context } from '@unchainedshop/types/api.js';
import {
  DeliveryError,
  DeliveryProvider as DeliveryProviderType,
} from '@unchainedshop/types/delivery.js';
import { DeliveryPricingDirector } from '@unchainedshop/core-delivery';

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
  interface(obj, _, { modules }) {
    const Interface = modules.delivery.findInterface(obj);

    // TODO: Harmonize with Payment, eliminate double mappings (_id -> key -> _id ...)
    if (!Interface) return null;

    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
    };
  },

  async isActive(deliveryProvider, _, requestContext) {
    const { modules } = requestContext;
    return modules.delivery.isActive(deliveryProvider, requestContext);
  },

  async configurationError(deliveryProvider, _, requestContext) {
    const { modules } = requestContext;
    return modules.delivery.configurationError(deliveryProvider, requestContext);
  },

  async simulatedPrice(
    deliveryProvider,
    { currency: currencyCode, orderId, useNetPrice, context: providerContext },
    requestContext,
  ) {
    const { modules, services, countryContext: country, user } = requestContext;
    const order = await modules.orders.findOrder({ orderId });

    const currency =
      currencyCode ||
      (await services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: country,
        },
        requestContext,
      ));

    const pricingDirector = await DeliveryPricingDirector.actions(
      {
        country,
        currency,
        provider: deliveryProvider,
        order,
        providerContext,
        user,
      },
      requestContext,
    );

    const calculated = await pricingDirector.calculate();
    if (!calculated || !calculated.length) return null;

    const pricing = pricingDirector.calculationSheet();

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
