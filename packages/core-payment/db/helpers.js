import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { PaymentDirector } from '../director';
import { PaymentProviders } from './collections';

PaymentProviders.helpers({
  transformContext(key, value) {
    return value;
  },
  defaultContext({ order }) { //eslint-disable-line
    return {};
  },
  interface() {
    return new PaymentDirector(this).interfaceClass();
  },
  configurationError(order) {
    return new PaymentDirector(this).configurationError({
      order,
    });
  },
  isActive(order) {
    return new PaymentDirector(this).isActive({
      order,
    });
  },
  isPayLaterAllowed(order) {
    return new PaymentDirector(this).isPayLaterAllowed({
      order,
    });
  },
  run(command, args, order) {
    return Promise.await(new PaymentDirector(this).run({
      command,
      args,
      order,
    }));
  },
  charge(payment, order) {
    return Promise.await(new PaymentDirector(this).charge({
      payment,
      order,
    }));
  },
});

PaymentProviders.createProvider = ({ type, ...rest }) => {
  const InterfaceClass = new PaymentDirector(rest).interfaceClass();
  const providerId = PaymentProviders.insert({
    ...rest,
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    type,
  });
  return PaymentProviders.findOne({ _id: providerId });
};

PaymentProviders.updateProvider = ({ _id, ...rest }) => {
  PaymentProviders.update({ _id, deleted: null }, {
    $set: {
      ...rest,
      updated: new Date(),
    },
  });
  return PaymentProviders.findOne({ _id, deleted: null });
};

PaymentProviders.removeProvider = ({ _id }) => {
  PaymentProviders.update({ _id, deleted: null }, {
    $set: {
      deleted: new Date(),
    },
  });
  return PaymentProviders.findOne({ _id });
};
