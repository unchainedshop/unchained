import type { mongodb } from '@unchainedshop/mongodb';
import { Event } from '@unchainedshop/types/events.js';
import { buildDbIndexes } from '@unchainedshop/mongodb';

const TWO_DAYS_SEC = 172800;

export const EventsCollection = async (db: mongodb.Db) => {
  const Events = db.collection<Event>('events');

  await buildDbIndexes(Events, [
    {
      index: { created: -1 },
      options: { expireAfterSeconds: TWO_DAYS_SEC, name: 'created' },
    },
    { index: { type: 1 }, options: { name: 'type' } },
    {
      index: { _id: 'text', type: 'text' },
      options: {
        weights: {
          _id: 8,
          type: 4,
        },
        name: 'events_fulltext_search',
      },
    },
  ]);

  return Events;
};
