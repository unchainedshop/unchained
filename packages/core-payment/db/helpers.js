import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { PaymentDirector } from '../director';
import { PaymentProviders } from './collections';

const emptyContext = {};

PaymentProviders.helpers({
  transformContext(key, value) {
    return value;
  },
  defaultContext(context) {
    return context || emptyContext;
  },
  interface() {
    return new PaymentDirector(this).interfaceClass();
  },
  configurationError() {
    return new PaymentDirector(this).configurationError();
  },
  isActive(context) {
    return new PaymentDirector(this).isActive(this.defaultContext(context));
  },
  isPayLaterAllowed(context) {
    return new PaymentDirector(this).isPayLaterAllowed(
      this.defaultContext(context)
    );
  },
  async run(command, ...args) {
    const director = new PaymentDirector(this);
    return director.run(
      this.defaultContext({
        command,
        args
      })
    );
  },
  async charge(context) {
    const director = new PaymentDirector(this);
    return director.charge(this.defaultContext(context));
  }
});

PaymentProviders.createProvider = ({ type, ...rest }) => {
  const InterfaceClass = new PaymentDirector(rest).interfaceClass();
  const providerId = PaymentProviders.insert({
    ...rest,
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    type
  });
  return PaymentProviders.findOne({ _id: providerId });
};

PaymentProviders.updateProvider = ({ _id, ...rest }) => {
  PaymentProviders.update(
    { _id, deleted: null },
    {
      $set: {
        ...rest,
        updated: new Date()
      }
    }
  );
  return PaymentProviders.findOne({ _id, deleted: null });
};

PaymentProviders.removeProvider = ({ _id }) => {
  PaymentProviders.update(
    { _id, deleted: null },
    {
      $set: {
        deleted: new Date()
      }
    }
  );
  return PaymentProviders.findOne({ _id });
};

PaymentProviders.findProviderById = _id => PaymentProviders.findOne({ _id });

PaymentProviders.findProviders = ({ type } = {}) =>
  PaymentProviders.find({ ...(type ? { type } : {}), deleted: null }).fetch();
