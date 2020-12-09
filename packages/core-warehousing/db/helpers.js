import { Promise } from 'meteor/promise';
import 'meteor/dburles:collection-helpers';
import { WarehousingProviders } from './collections';
import { WarehousingDirector } from '../director';

WarehousingProviders.helpers({
  transformContext(key, value) {
    return value;
  },
  defaultContext() {
    return {};
  },
  interface() {
    return new WarehousingDirector(this).interfaceClass();
  },
  configurationError() {
    return new WarehousingDirector(this).configurationError();
  },
  isActive(context) {
    return new WarehousingDirector(this).isActive(context);
  },
  estimatedDispatch(context) {
    return Promise.await(
      new WarehousingDirector(this).estimatedDispatch(context)
    );
  },
  estimatedStock(context) {
    return Promise.await(new WarehousingDirector(this).estimatedStock(context));
  },
});

WarehousingProviders.createProvider = (providerData) => {
  const InterfaceClass = new WarehousingDirector(providerData).interfaceClass();
  if (!InterfaceClass) return null;
  const providerId = WarehousingProviders.insert({
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    ...providerData,
  });
  return WarehousingProviders.findOne({ _id: providerId });
};

WarehousingProviders.updateProvider = ({ _id, ...rest }) => {
  WarehousingProviders.update(
    { _id, deleted: null },
    {
      $set: {
        ...rest,
        updated: new Date(),
      },
    }
  );
  return WarehousingProviders.findOne({ _id, deleted: null });
};

WarehousingProviders.removeProvider = ({ _id }) => {
  WarehousingProviders.update(
    { _id, deleted: null },
    {
      $set: {
        deleted: new Date(),
      },
    }
  );
  return WarehousingProviders.findOne({ _id });
};

WarehousingProviders.findProviderById = (_id, ...options) =>
  WarehousingProviders.findOne({ _id }, ...options);

WarehousingProviders.findProviders = ({ type } = {}, ...options) =>
  WarehousingProviders.find(
    { ...(type ? { type } : {}), deleted: null },
    ...options
  ).fetch();

WarehousingProviders.findSupported = (
  { product, deliveryProvider },
  ...options
) =>
  WarehousingProviders.findProviders(
    {},
    ...options
  ).filter((warehousingProvider) =>
    warehousingProvider.isActive({ product, deliveryProvider })
  );
