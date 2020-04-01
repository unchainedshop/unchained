import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';
import { PaymentProviders } from './collections';

export const PaymentProviderType = { // eslint-disable-line
  CARD: 'CARD',
  INVOICE: 'INVOICE',
  GENERIC: 'GENERIC',
};

PaymentProviders.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true, index: true },
      adapterKey: { type: String, required: true },
      configuration: { type: Array },
      'configuration.$': { type: Object },
      'configuration.$.key': { type: String },
      'configuration.$.value': { type: String },
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

export default () => {
  Meteor.startup(() => {
    Migrations.migrateTo('latest');
  });
};
