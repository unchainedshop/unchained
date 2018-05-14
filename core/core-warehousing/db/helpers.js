import { Promise } from 'meteor/promise';
import 'meteor/dburles:collection-helpers';
import { WarehousingProviders } from './collections';
import { WarehousingDirector } from '../director';

WarehousingProviders.helpers({
  format(key, value) {
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
    return Promise.await(new WarehousingDirector(this).estimatedDispatch(context));
  },
});

WarehousingProviders.createProvider = ({ type, ...rest }) => {
  const InterfaceClass = new WarehousingDirector(rest).interfaceClass();
  const providerId = WarehousingProviders.insert({
    ...rest,
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    type,
  });
  return WarehousingProviders.findOne({ _id: providerId });
};

WarehousingProviders.updateProvider = ({ warehousingProviderId, ...rest }) => {
  WarehousingProviders.update({ _id: warehousingProviderId }, {
    $set: {
      ...rest,
      updated: new Date(),
    },
  });
  return WarehousingProviders.findOne({ _id: warehousingProviderId });
};

WarehousingProviders.removeProvider = ({ warehousingProviderId }) => {
  const provider = WarehousingProviders.findOne({ _id: warehousingProviderId });
  WarehousingProviders.remove({ _id: warehousingProviderId });
  return provider;
};

WarehousingProviders.findSupported = ({ product, deliveryProvider }) => {
  const providers = WarehousingProviders
    .find()
    .fetch()
    .filter(warehousingProvider =>
      warehousingProvider.isActive({ product, deliveryProvider }));
  return providers;
};
