import { EventsSchema } from './EventsSchema';

export const EventsCollection = async (db) => {
  const Events = new db.Collection('events');

  Events.attachSchema(EventsSchema);

  await Events.createIndex({ created: -1 });
  await Events.createIndex({ type: 1 });

  return Events
};