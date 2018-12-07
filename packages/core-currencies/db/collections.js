import { Mongo } from 'meteor/mongo';

export const Currencies = new Mongo.Collection('currencies');

export default Currencies;
