import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { Users } from 'meteor/unchained:core-users';
import { emit } from 'meteor/unchained:core-events';
import { PaymentDirector } from '../director';
import { PaymentProviders, PaymentCredentials } from './collections';
import settings from '../settings';

const emptyContext = {};

const buildFindSelector = ({ type, deleted = null } = {}) => {
  return { ...(type ? { type } : {}), deleted };
};

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

PaymentProviders.findInterfaces = ({ type }) => {
  return PaymentDirector.filteredAdapters((Interface) =>
    Interface.typeSupported(type)
  ).map((Interface) => ({
    _id: Interface.key,
    label: Interface.label,
    version: Interface.version,
  }));
};

PaymentProviders.helpers({
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
    const normalizedContext = this.defaultContext({
      ...context,
      transactionContext: {
        ...context.transactionContext,
        paymentCredentials:
          context.transactionContext?.paymentCredentials ??
          PaymentCredentials.findOne({
            userId,
            paymentProviderId: this._id,
            isPreferred: true,
          }),
      },
    });
    const result = Promise.await(director.charge(normalizedContext, userId));
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

PaymentCredentials.credentialsExists = ({ paymentCredentialsId }) => {
  return !!PaymentCredentials.find({ _id: paymentCredentialsId }).count();
};

PaymentCredentials.findCredentials = ({ paymentCredentialsId }, options) => {
  return PaymentCredentials.findOne({ _id: paymentCredentialsId }, options);
};

PaymentCredentials.upsertCredentials = ({
  userId,
  paymentProviderId,
  token,
  ...meta
}) => {
  const { insertedId } = PaymentCredentials.upsert(
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

  if (insertedId) {
    PaymentCredentials.markPreferred({
      userId,
      paymentCredentialsId: insertedId,
    });
    return insertedId;
  }
  return null;
};

PaymentCredentials.registerPaymentCredentials = ({
  paymentContext,
  userId,
  paymentProviderId,
}) => {
  const paymentProvider = PaymentProviders.findOne({ _id: paymentProviderId });
  const registration = paymentProvider.register(
    { transactionContext: paymentContext },
    userId
  );
  if (!registration) return null;
  const { token, ...meta } = registration;
  const paymentCredentialsId = PaymentCredentials.upsertCredentials({
    userId,
    paymentProviderId,
    token,
    ...meta,
  });
  return PaymentCredentials.findOne(
    paymentCredentialsId
      ? { _id: paymentCredentialsId }
      : { userId, paymentProviderId }
  );
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

PaymentProviders.createProvider = (providerData) => {
  const InterfaceClass = new PaymentDirector(providerData).interfaceClass();
  if (!InterfaceClass) return null;
  const providerId = PaymentProviders.insert({
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    ...providerData,
  });
  const paymentProvider = PaymentProviders.findOne({ _id: providerId });
  emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
  return paymentProvider;
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
  const paymentProvider = PaymentProviders.findOne({ _id, deleted: null });
  emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });
  return paymentProvider;
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
  const paymentProvider = PaymentProviders.findOne({ _id });
  emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
  return paymentProvider;
};

PaymentProviders.providerExists = ({ paymentProviderId }) => {
  return !!PaymentProviders.find(
    { _id: paymentProviderId, deleted: null },
    { limit: 1 }
  ).count();
};

PaymentProviders.findProvider = (
  { paymentProviderId, ...rest },
  ...options
) => {
  return PaymentProviders.findOne(
    { _id: paymentProviderId, ...rest },
    ...options
  );
};

PaymentProviders.findProviders = (query, ...options) =>
  PaymentProviders.find(buildFindSelector(query), ...options).fetch();

PaymentProviders.findSupported = ({ order }, ...options) => {
  const providers = PaymentProviders.findProviders({}, ...options).filter(
    (paymentProvider) => paymentProvider.isActive(order)
  );
  return settings.filterSupportedProviders({ providers, order });
};

PaymentProviders.count = async (query) => {
  const count = await PaymentProviders.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};
