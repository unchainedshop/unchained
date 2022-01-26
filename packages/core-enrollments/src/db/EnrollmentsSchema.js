import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

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

export const EnrollmentsSchema = new SimpleSchema(
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
    enrollmentNumber: String,
    expires: Date,
    meta: { type: Object, blackbox: true },
    billingAddress: Schemas.Address,
    contact: Schemas.Contact,
    currencyCode: String,
    countryCode: String,
    payment: { type: Object },
    'payment.paymentProviderId': String,
    'payment.context': Schemas.contextFields.context,
    delivery: { type: Object },
    'delivery.deliveryProviderId': String,
    'delivery.context': Schemas.contextFields.context,
    periods: { type: Array },
    'periods.$': { type: PeriodSchema, required: true },
    ...Schemas.logFields,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
