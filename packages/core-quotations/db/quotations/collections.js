import { Mongo } from 'meteor/mongo';

export const Quotations = new Mongo.Collection('quotations');

export default Quotations;
