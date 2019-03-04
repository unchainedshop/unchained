import { Mongo } from "meteor/mongo";

export const PaymentProviders = new Mongo.Collection("payment-providers");

export default PaymentProviders;
