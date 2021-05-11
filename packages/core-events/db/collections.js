import { Mongo } from 'meteor/mongo';

export const Events = new Mongo.Collection('events');

export default Events;
