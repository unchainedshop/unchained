import 'meteor/dburles:collection-helpers';
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
  async estimatedDeliveryThroughput(context) {
    const director = new DeliveryDirector(this);
    return director.estimatedDeliveryThroughput(this.defaultContext(context));
  },
  isAutoReleaseAllowed(context) {
    return new DeliveryDirector(this).isAutoReleaseAllowed(
      this.defaultContext(context)
    );
  },
  async send(context) {
    const director = new DeliveryDirector(this);
    return director.send(this.defaultContext(context));
  }
});

DeliveryProviders.createProvider = ({ type, ...rest }) => {
  const InterfaceClass = new DeliveryDirector(rest).interfaceClass();
  const _id = DeliveryProviders.insert({
    ...rest,
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    type
  });
  return DeliveryProviders.findOne({ _id });
};

DeliveryProviders.updateProvider = ({ _id, ...rest }) => {
  DeliveryProviders.update(
    { _id, deleted: null },
    {
      $set: {
        ...rest,
        updated: new Date()
      }
    }
  );
  return DeliveryProviders.findOne({ _id, deleted: null });
};

DeliveryProviders.removeProvider = ({ _id }) => {
  DeliveryProviders.update(
    { _id, deleted: null },
    {
      $set: {
        deleted: new Date()
      }
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
