import { Mongo } from 'meteor/mongo';

export const PaymentProviders = new Mongo.Collection('payment-providers');

export const PaymentCredentials = new Mongo.Collection('payment_credentials');

export default PaymentProviders;
