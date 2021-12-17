import { DeliveryProviderHelperTypes } from '@unchainedshop/types/delivery';
import crypto from 'crypto';
import { DeliveryPricingDirector } from 'meteor/unchained:director-pricing';

export const DeliveryProvider: DeliveryProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.delivery.findInterface(obj);
    if (!Interface) return null;

    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
    };
  },

  async simulatedPrice(
    obj,
    { currency: currencyCode, orderId, useNetPrice, context: providerContext },
    requestContext
  ) {
    const { services, countryContext: country, userId } = requestContext;
    // TODO: replace with module
    /* @ts-ignore */
    const order = Orders.findOrder({ orderId });

    const currency =
      currencyCode ||
      (await services.countries.resolveDefaultCurrencyCode({
        isoCode: country,
      }));

    const user = await requestContext.modules.users.findUser({ userId });

    const pricingDirector = new DeliveryPricingDirector(
      {
        country,
        currency,
        deliveryProvider: obj,
        order,
        providerContext,
        user,
      },
      requestContext
    );

    const calculated = await pricingDirector.calculate();
    if (!calculated) return null;

    const pricing = pricingDirector.resultSheet();
    const orderPrice = pricing.total(null, useNetPrice) as { amount: number, currency: string };

    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [this._id, country, useNetPrice, order ? order._id : ''].join('')
        )
        .digest('hex'),
      amount: orderPrice.amount,
      currencyCode: orderPrice.currency,
      countryCode: country,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
};
