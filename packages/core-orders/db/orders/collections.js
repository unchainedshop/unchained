import { Mongo } from 'meteor/mongo';

export const Orders = new Mongo.Collection('orders');

export default Orders;
