import { Db } from '@unchainedshop/types';
import { Event } from '@unchainedshop/types/events';
import { buildDbIndexes } from 'meteor/unchained:utils';

const TWO_DAYS_SEC = 172800;

export const EventsCollection = async (db: Db) => {
  const Events = db.collection<Event>('events');

  await buildDbIndexes(Events, [
    () =>
      Events.createIndex(
        { created: -1 },
        { expireAfterSeconds: TWO_DAYS_SEC, name: 'created' }
      ),
    () => Events.createIndex({ type: 1 }, { name: 'type' }),
  ]);

  return Events;
};
