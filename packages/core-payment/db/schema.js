import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';

import { PaymentProviders, PaymentCredentials } from './collections';

export const PaymentProviderType = {
  // eslint-disable-line
  CARD: 'CARD',
  INVOICE: 'INVOICE',
  GENERIC: 'GENERIC',
};

PaymentProviders.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true },
      adapterKey: { type: String, required: true },
      authorId: { type: String, required: true },
      configuration: { type: Array },
      'configuration.$': { type: Object },
      'configuration.$.key': { type: String },
      'configuration.$.value': { type: String },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

PaymentCredentials.attachSchema(
  new SimpleSchema(
    {
      paymentProviderId: { type: String, required: true },
      userId: { type: String, required: true },
      token: String,
      isPreferred: Boolean,
      meta: { type: Object, blackbox: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20181128,
  name: 'Rename pament provider keys',
  up() {
    PaymentProviders.update(
      { adapterKey: 'ch.dagobert.invoice' },
      {
        $set: { adapterKey: 'shop.unchained.invoice' },
      },
      { multi: true }
    );
  },
  down() {
    PaymentProviders.update(
      { adapterKey: 'shop.unchained.invoice' },
      {
        $set: { adapterKey: 'ch.dagobert.invoice' },
      },
      { multi: true }
    );
  },
});

Migrations.add({
  version: 20200728.4,
  name: 'Add default authorId to payment',
  up() {
    PaymentProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        PaymentProviders.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          }
        );
      });
  },
  down() {
    PaymentProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        PaymentProviders.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          }
        );
      });
  },
});

Migrations.add({
  version: 20200915.3,
  name: 'drop PaymentProvider & PaymentCredentials related indexes',
  up() {
    PaymentProviders.rawCollection()
      .dropIndexes()
      .catch(() => {});
    PaymentCredentials.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

export default () => {
  PaymentProviders.rawCollection().createIndex({ type: 1 });

  PaymentCredentials.rawCollection().createIndex({ paymentProviderId: 1 });
  PaymentCredentials.rawCollection().createIndex({ userId: 1 });
};
