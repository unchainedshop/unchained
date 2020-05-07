import { Mongo } from 'meteor/mongo';

export const Subscriptions = new Mongo.Collection('subscriptions');

export default Subscriptions;
