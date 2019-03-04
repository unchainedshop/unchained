import { Mongo } from 'meteor/mongo';

export const OrderPayments = new Mongo.Collection('order_payments');

export default OrderPayments;
