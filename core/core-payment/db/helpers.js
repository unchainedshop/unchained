import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { PaymentDirector } from '../director';
import { PaymentProviders } from './collections';

PaymentProviders.helpers({
  format(key, value) {
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

PaymentProviders.updateProvider = ({ paymentProviderId, ...rest }) => {
  PaymentProviders.update({ _id: paymentProviderId }, {
    $set: {
      ...rest,
      updated: new Date(),
    },
  });
  return PaymentProviders.findOne({ _id: paymentProviderId });
};

PaymentProviders.removeProvider = ({ paymentProviderId }) => {
  const provider = PaymentProviders.findOne({ _id: paymentProviderId });
  // TODO: Providers can not be removed!
  PaymentProviders.remove({ _id: paymentProviderId });
  return provider;
};
