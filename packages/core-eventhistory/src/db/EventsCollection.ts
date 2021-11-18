import { Db } from 'unchained-core-types';
import { Event } from 'unchained-core-types/events';

export const EventsCollection = async (db: Db) => {
  const Events = db.collection<Event>('events');

  await Events.createIndex({ created: -1 });
  await Events.createIndex({ type: 1 });

  return Events;
};
