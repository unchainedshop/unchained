import { Promise } from 'meteor/promise';
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
  estimatedDeliveryThroughput(context, warehousingThroughputTime) {
    return Promise.await(new DeliveryDirector(this)
      .estimatedDeliveryThroughput(this.defaultContext(context), warehousingThroughputTime));
  },
  isActive(context) {
    return new DeliveryDirector(this)
      .isActive(this.defaultContext(context));
  },
  send(context) {
    return new DeliveryDirector(this)
      .send(this.defaultContext(context));
  },
});

DeliveryProviders.createProvider = ({ type, ...rest }) => {
  const InterfaceClass = new DeliveryDirector(rest).interfaceClass();
  const providerId = DeliveryProviders.insert({
    ...rest,
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    type,
  });
  return DeliveryProviders.findOne({ _id: providerId });
};

DeliveryProviders.updateProvider = ({ deliveryProviderId, ...rest }) => {
  DeliveryProviders.update({ _id: deliveryProviderId }, {
    $set: {
      ...rest,
      updated: new Date(),
    },
  });
  return DeliveryProviders.findOne({ _id: deliveryProviderId });
};

DeliveryProviders.removeProvider = ({ deliveryProviderId }) => {
  const provider = DeliveryProviders.findOne({ _id: deliveryProviderId });
  DeliveryProviders.remove({ _id: deliveryProviderId });
  return provider;
};
