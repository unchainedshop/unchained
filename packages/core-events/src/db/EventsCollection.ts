import { Db } from 'unchained-core-types';
import { Event } from 'unchained-core-types/events';

const TWO_DAYS_SEC = 172800;

export const EventsCollection = async (db: Db) => {
  const Events = db.collection<Event>('events');

  await Events.createIndex(
    { created: -1 },
    { expireAfterSeconds: TWO_DAYS_SEC }
  );
  await Events.createIndex({ type: 1 });

  return Events;
};
