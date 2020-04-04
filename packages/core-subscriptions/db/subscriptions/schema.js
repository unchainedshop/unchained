import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Subscriptions } from './collections';

const { logFields, contextFields, timestampFields, Address, Contact } = Schemas;

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
    subscriptionNumber: String,
    adapterKey: String,
    expires: Date,
    meta: { type: Object, blackbox: true },
    billingAddress: Address,
    contact: Contact,
    currencyCode: String,
    countryCode: String,
    payment: { type: Object },
    'payment.paymentProviderId': String,
    'payment.context': contextFields.context,
    delivery: { type: Object },
    'delivery.paymentProviderId': String,
    'delivery.context': contextFields.context,
    ...timestampFields,
    ...contextFields,
    ...logFields,
  },
  { requiredByDefault: false }
);

Subscriptions.attachSchema(Schema);
