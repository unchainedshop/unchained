import { EventsSchema } from './EventsSchema';

export const EventsCollection = (db) => {
  const Events = new db.Collection('events');

  Events.attachSchema(EventsSchema);

  Events.createIndex({ created: -1 });
  Events.createIndex({ type: 1 });

  return Events
};