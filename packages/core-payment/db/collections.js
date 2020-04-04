import { Mongo } from 'meteor/mongo';

export const PaymentProviders = new Mongo.Collection('payment-providers');

export const PaymentProviderStoredCredentials = new Mongo.Collection(
  'payment_provider_stored_credentials'
);

export default PaymentProviders;
