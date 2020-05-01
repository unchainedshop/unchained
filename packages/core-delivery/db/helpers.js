import { Promise } from 'meteor/promise';
import 'meteor/dburles:collection-helpers';
import crypto from 'crypto';
import { Countries } from 'meteor/unchained:core-countries';
import { DeliveryPricingDirector } from 'meteor/unchained:core-pricing';
import { DeliveryProviders } from './collections';
import { DeliveryDirector } from '../director';

const emptyContext = {};

DeliveryProviders.helpers({
  transformContext(key, value) {
    return value;
  },
  defaultContext(context) {
    return context || emptyContext;
  },
  interface() {
    return new DeliveryDirector(this).interfaceClass();
  },
  configurationError() {
    return new DeliveryDirector(this).configurationError();
  },
  isActive(context) {
    return new DeliveryDirector(this).isActive(this.defaultContext(context));
  },
  estimatedDeliveryThroughput(context) {
    return Promise.await(
      new DeliveryDirector(this).estimatedDeliveryThroughput(
        this.defaultContext(context)
      )
    );
  },
  isAutoReleaseAllowed(context) {
    return new DeliveryDirector(this).isAutoReleaseAllowed(
      this.defaultContext(context)
    );
  },
  run(command, context, ...args) {
    return Promise.await(
      new DeliveryDirector(this).run(
        command,
        this.defaultContext(context),
        ...args
      )
    );
  },
  send(context) {
    return Promise.await(
      new DeliveryDirector(this).send(this.defaultContext(context))
    );
  },
  orderPrice(
    { country, order, user, useNetPrice, providerContext },
    requestContext
  ) {
    const currency = Countries.resolveDefaultCurrencyCode({
      isoCode: country,
    });
    const pricingDirector = new DeliveryPricingDirector({
      providerContext,
      deliveryProvider: this,
      order,
      user,
      country,
      currency,
      requestContext,
    });
    const calculated = pricingDirector.calculate();
    if (!calculated) return null;

    const pricing = pricingDirector.resultSheet();
    const amount = useNetPrice ? pricing.net() : pricing.gross();
    const orderPrice = { amount, currency: pricing.currency };

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
});

DeliveryProviders.createProvider = ({ type, ...rest }) => {
  const InterfaceClass = new DeliveryDirector(rest).interfaceClass();
  const _id = DeliveryProviders.insert({
    ...rest,
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    type,
  });
  return DeliveryProviders.findOne({ _id });
};

DeliveryProviders.updateProvider = ({ _id, ...rest }) => {
  DeliveryProviders.update(
    { _id, deleted: null },
    {
      $set: {
        ...rest,
        updated: new Date(),
      },
    }
  );
  return DeliveryProviders.findOne({ _id, deleted: null });
};

DeliveryProviders.removeProvider = ({ _id }) => {
  DeliveryProviders.update(
    { _id, deleted: null },
    {
      $set: {
        deleted: new Date(),
      },
    }
  );
  return DeliveryProviders.findOne({ _id });
};

DeliveryProviders.findProviderById = (_id, ...options) =>
  DeliveryProviders.findOne({ _id }, ...options);

DeliveryProviders.findProviders = ({ type } = {}, ...options) =>
  DeliveryProviders.find(
    { ...(type ? { type } : {}), deleted: null },
    ...options
  ).fetch();

DeliveryProviders.findSupported = ({ order }, ...options) =>
  DeliveryProviders.findProviders({}, ...options)
    .filter((deliveryProvider) => deliveryProvider.isActive(order))
    .sort(DeliveryDirector.createSortProviders({ order }));
