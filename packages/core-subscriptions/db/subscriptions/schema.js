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

export const PeriodSchema = new SimpleSchema(
  {
    orderId: { type: String },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    isTrial: { type: Boolean },
  },
  {
    requiredByDefault: false,
  },
);

export const Schema = new SimpleSchema(
  {
    userId: { type: String, required: true },
    status: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number },
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
    subscriptionNumber: String,
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
    'delivery.deliveryProviderId': String,
    'delivery.context': contextFields.context,
    periods: { type: Array },
    'periods.$': { type: PeriodSchema, required: true },
    ...timestampFields,
    ...contextFields,
    ...logFields,
  },
  { requiredByDefault: false },
);

Subscriptions.attachSchema(Schema);

Subscriptions.rawCollection().createIndex({ userId: 1 });
Subscriptions.rawCollection().createIndex({ productId: 1 });
Subscriptions.rawCollection().createIndex({ status: 1 });
