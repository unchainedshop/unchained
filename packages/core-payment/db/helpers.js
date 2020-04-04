import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { PaymentDirector } from '../director';
import {
  PaymentProviders,
  PaymentProviderStoredCredentials,
} from './collections';

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
  run(command, context, ...args) {
    return Promise.await(
      new PaymentDirector(this).run(
        command,
        this.defaultContext(context),
        ...args
      )
    );
  },
  register(context, userId) {
    const credentials = Promise.await(
      new PaymentDirector(this).register(this.defaultContext(context))
    );
    if (credentials) {
      PaymentProviderStoredCredentials.upsertCredentials({
        userId,
        paymentProviderId: this._id,
        credentials,
      });
      return true;
    }
    return false;
  },
  storedCredentials(userId) {
    const found = PaymentProviderStoredCredentials.findOne({
      userId,
      paymentProviderId: this._id,
    });
    return found?.credentials;
  },
  validate(userId) {
    const credentials = this.storedCredentials(userId);
    return Promise.await(new PaymentDirector(this).validate(credentials));
  },
  charge(context, userId) {
    const director = new PaymentDirector(this);
    const { credentials, ...strippedResult } = Promise.await(
      director.charge(this.defaultContext(context))
    );
    if (credentials)
      PaymentProviderStoredCredentials.upsertCredentials({
        userId,
        paymentProviderId: this._id,
        credentials,
      });
    return strippedResult;
  },
});

PaymentProviderStoredCredentials.upsertCredentials = ({
  userId,
  paymentProviderId,
  credentials,
}) => {
  return PaymentProviderStoredCredentials.upsert(
    {
      userId,
      paymentProviderId,
    },
    {
      $setOnInsert: {
        userId,
        paymentProviderId,
      },
      credentials,
    }
  );
};

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
  PaymentProviders.update(
    { _id, deleted: null },
    {
      $set: {
        ...rest,
        updated: new Date(),
      },
    }
  );
  return PaymentProviders.findOne({ _id, deleted: null });
};

PaymentProviders.removeProvider = ({ _id }) => {
  PaymentProviders.update(
    { _id, deleted: null },
    {
      $set: {
        deleted: new Date(),
      },
    }
  );
  return PaymentProviders.findOne({ _id });
};

PaymentProviders.findProviderById = (_id) => PaymentProviders.findOne({ _id });

PaymentProviders.findProviders = ({ type } = {}) =>
  PaymentProviders.find({ ...(type ? { type } : {}), deleted: null }).fetch();
