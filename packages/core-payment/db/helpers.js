import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { Users } from 'meteor/unchained:core-users';
import { PaymentDirector } from '../director';
import { PaymentProviders, PaymentCredentials } from './collections';

const emptyContext = {};

Users.helpers({
  async paymentCredentials(selector = {}) {
    return PaymentCredentials.find(
      { ...selector, userId: this._id },
      {
        sort: {
          created: -1,
        },
      }
    ).fetch();
  },
});

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
  register(context) {
    return Promise.await(
      new PaymentDirector(this).register(this.defaultContext(context))
    );
  },
  validate(credentials) {
    return Promise.await(new PaymentDirector(this).validate(credentials));
  },
  sign(context) {
    return Promise.await(
      new PaymentDirector(this).sign(this.defaultContext(context))
    );
  },
  charge(context, userId) {
    const director = new PaymentDirector(this);
    const result = Promise.await(director.charge(this.defaultContext(context)));
    if (!result) return false;
    const { credentials, ...strippedResult } = result;
    if (credentials) {
      PaymentCredentials.upsertCredentials({
        userId,
        paymentProviderId: this._id,
        ...credentials,
      });
    }
    return strippedResult;
  },
});

PaymentCredentials.helpers({
  async user() {
    return Users.findOne({
      _id: this.userId,
    });
  },
  async paymentProvider() {
    return PaymentProviders.findOne({
      _id: this.paymentProviderId,
    });
  },
  async isValid() {
    const provider = await this.paymentProvider();
    return provider.validate(this);
  },
});

PaymentCredentials.markPreferred = ({ userId, paymentCredentialsId }) => {
  PaymentCredentials.update(
    {
      _id: paymentCredentialsId,
    },
    {
      $set: {
        isPreferred: true,
      },
    }
  );
  PaymentCredentials.update(
    {
      _id: { $ne: paymentCredentialsId },
      userId,
    },
    {
      $set: {
        isPreferred: false,
      },
    }
  );
};

PaymentCredentials.upsertCredentials = ({
  userId,
  paymentProviderId,
  token,
  ...meta
}) => {
  const upsertedId = PaymentCredentials.upsert(
    {
      userId,
      paymentProviderId,
    },
    {
      $setOnInsert: {
        userId,
        paymentProviderId,
        isPreferred: false,
        created: new Date(),
      },
      $set: {
        updated: new Date(),
        token,
        meta,
      },
    }
  );
  return upsertedId;
};

PaymentCredentials.registerPaymentCredentials = ({
  paymentContext,
  userId,
  paymentProviderId,
}) => {
  const paymentProvider = PaymentProviders.findOne({ _id: paymentProviderId });
  const { token, ...meta } = paymentProvider.register(
    { transactionContext: paymentContext },
    userId
  );
  const paymentCredentialsId = PaymentCredentials.insert({
    userId,
    paymentProviderId,
    token,
    meta,
    isPreferred: false,
    created: new Date(),
  });
  PaymentCredentials.markPreferred({ userId, paymentCredentialsId });
  return PaymentCredentials.findOne({ _id: paymentCredentialsId });
};

PaymentCredentials.removeCredentials = ({ paymentCredentialsId }) => {
  const paymentCredentials = PaymentCredentials.findOne({
    _id: paymentCredentialsId,
  });
  PaymentCredentials.remove({
    _id: paymentCredentialsId,
  });
  return paymentCredentials;
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
