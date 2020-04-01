import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';
import { Quotations } from './collections';

const { logFields, contextFields, timestampFields } = Schemas;

export const QuotationStatus = {
  REQUESTED: 'REQUESTED',
  PROCESSING: 'PROCESSING',
  PROPOSED: 'PROPOSED',
  FULLFILLED: 'FULLFILLED',
  REJECTED: 'REJECTED',
};

Quotations.attachSchema(
  new SimpleSchema(
    {
      userId: { type: String, required: true, index: true },
      productId: { type: String, required: true, index: true },
      status: { type: String, required: true, index: true },
      quotationNumber: String,
      price: Number,
      expires: Date,
      rejected: Date,
      meta: { type: Object, blackbox: true },
      fullfilled: Date,
      currency: String,
      countryCode: String,
      configuration: Array,
      'configuration.$': {
        type: Object,
        required: true,
      },
      'configuration.$.key': {
        type: String,
        required: true,
      },
      'configuration.$.value': {
        type: String,
      },
      ...timestampFields,
      ...contextFields,
      ...logFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20191014,
  name: 'Store currency in currencyCode field instead of currency',
  up() {
    Quotations.find()
      .fetch()
      .forEach((user) => {
        Quotations.update(
          { _id: user._id },
          {
            $set: {
              currencyCode: user.currency || null,
            },
            $unset: {
              currency: 1,
            },
          }
        );
      });
  },
  down() {
    Quotations.find()
      .fetch()
      .forEach((user) => {
        Quotations.update(
          { _id: user._id },
          {
            $set: {
              currency: user.currencyCode || null,
            },
            $unset: {
              currencyCode: 1,
            },
          }
        );
      });
  },
});

export default () => {
  Meteor.startup(() => {
    Migrations.migrateTo('latest');
  });
};
