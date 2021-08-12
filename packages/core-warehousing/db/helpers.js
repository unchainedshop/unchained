import { Promise } from 'meteor/promise';
import 'meteor/dburles:collection-helpers';
import { emit } from 'meteor/unchained:core-events';
import { WarehousingProviders } from './collections';
import { WarehousingDirector } from '../director';

WarehousingProviders.findInterfaces = ({ type }) => {
  return WarehousingDirector.filteredAdapters((Interface) =>
    Interface.typeSupported(type)
  ).map((Interface) => ({
    _id: Interface.key,
    label: Interface.label,
    version: Interface.version,
  }));
};

WarehousingProviders.helpers({
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
  const warehousingProvider = WarehousingProviders.findOne({ _id: providerId });
  emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
  return warehousingProvider;
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
  const warehousingProvider = WarehousingProviders.findOne({
    _id,
    deleted: null,
  });
  emit('WAREHOUSING_PROVIDER_UPDATE', { warehousingProvider });
  return warehousingProvider;
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
  const warehousingProvider = WarehousingProviders.findOne({ _id });
  emit('WAREHOUSING_PROVIDER_REMOVE', { warehousingProvider });
  return warehousingProvider;
};

WarehousingProviders.providerExists = ({ warehousingProviderId }) => {
  return !!WarehousingProviders.find(
    { _id: warehousingProviderId, deleted: null },
    { limit: 1 }
  ).count();
};

WarehousingProviders.findProvider = (
  { warehousingProviderId, ...rest },
  ...options
) => {
  return WarehousingProviders.findOne(
    { _id: warehousingProviderId, ...rest },
    ...options
  );
};

const buildFindSelector = ({ type, deleted = null } = {}) => {
  return { ...(type ? { type } : {}), deleted };
};

WarehousingProviders.findProviders = (query, ...options) =>
  WarehousingProviders.find(buildFindSelector(query), ...options).fetch();

WarehousingProviders.count = async (query) => {
  const count = await WarehousingProviders.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

WarehousingProviders.findSupported = (
  { product, deliveryProvider },
  ...options
) =>
  WarehousingProviders.findProviders({}, ...options).filter(
    (warehousingProvider) =>
      warehousingProvider.isActive({ product, deliveryProvider })
  );
