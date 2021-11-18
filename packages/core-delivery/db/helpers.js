import { Promise } from 'meteor/promise';
import 'meteor/dburles:collection-helpers';
import crypto from 'crypto';
import { Countries } from 'meteor/unchained:core-countries';
import { DeliveryPricingDirector } from 'meteor/unchained:core-pricing';
import { emit } from 'unchained-events';
import { DeliveryProviders } from './collections';
import { DeliveryDirector } from '../director';
import settings from '../settings';

const emptyContext = {};

const buildFindSelector = ({ type, deleted = null } = {}) => {
  return {
    ...(type ? { type } : {}),
    deleted,
  };
};

DeliveryProviders.helpers({
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
    {
      country,
      order,
      currency: currencyCode,
      user,
      useNetPrice,
      providerContext,
    },
    requestContext
  ) {
    const currency =
      currencyCode ||
      Countries.resolveDefaultCurrencyCode({
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
    const orderPrice = pricing.total(null, useNetPrice);

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

DeliveryProviders.createProvider = (providerData) => {
  const InterfaceClass = new DeliveryDirector(providerData).interfaceClass();
  if (!InterfaceClass) return null;
  const _id = DeliveryProviders.insert({
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    ...providerData,
  });
  const deliveryProvider = DeliveryProviders.findOne({ _id });
  emit('DELIVERY_PROVIDER_CREATE', { deliveryProvider });
  return deliveryProvider;
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
  const deliveryProvider = DeliveryProviders.findOne({ _id, deleted: null });
  emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });
  return deliveryProvider;
};

DeliveryProviders.removeProvider = ({ _id }) => {
  const result = DeliveryProviders.update(
    { _id, deleted: null },
    {
      $set: {
        deleted: new Date(),
      },
    }
  );
  emit('DELIVERY_PROVIDER_REMOVE', { deliveryProviderId: _id });
  return result;
};

DeliveryProviders.providerExists = ({ deliveryProviderId }) => {
  return !!DeliveryProviders.find(
    { _id: deliveryProviderId, deleted: null },
    { limit: 1 }
  ).count();
};

DeliveryProviders.findProvider = ({ deliveryProviderId, ...rest }) =>
  DeliveryProviders.findOne({ _id: deliveryProviderId, ...rest });

DeliveryProviders.findProviders = (query, ...options) =>
  DeliveryProviders.find(buildFindSelector(query), ...options).fetch();

DeliveryProviders.count = async (query) => {
  const count = await DeliveryProviders.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

DeliveryProviders.findSupported = ({ order }, ...options) => {
  const providers = DeliveryProviders.findProviders({}, ...options).filter(
    (deliveryProvider) => deliveryProvider.isActive(order)
  );
  return settings.filterSupportedProviders({ providers, order });
};

DeliveryProviders.findInterfaces = ({ type }) => {
  return DeliveryDirector.filteredAdapters((Interface) =>
    Interface.typeSupported(type)
  ).map((Interface) => ({
    _id: Interface.key,
    label: Interface.label,
    version: Interface.version,
  }));
};
