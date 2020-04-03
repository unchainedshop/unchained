import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Subscriptions } from './collections';

const { logFields, contextFields, timestampFields } = Schemas;

export const SubscriptionStatus = {
  INITIAL: 'INITIAL',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  TERMINATED: 'TERMINATED',
};

export const Schema = new SimpleSchema(
  {
    userId: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    quotationNumber: String,
    expires: Date,
    meta: { type: Object, blackbox: true },
    currencyCode: String,
    countryCode: String,
    ...timestampFields,
    ...contextFields,
    ...logFields,
  },
  { requiredByDefault: false }
);

Subscriptions.attachSchema(Schema);
