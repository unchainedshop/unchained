import { mongodb } from '@unchainedshop/mongodb';
import { buildDbIndexes } from '@unchainedshop/mongodb';
import type { TimestampFields } from '@unchainedshop/mongodb';

const EVENTS_TTL_SECONDS = Number(process.env.EVENTS_TTL_SECONDS) || 172800;

export type Event = {
  _id: string;
  type: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
} & TimestampFields;

export const EventsCollection = async (db: mongodb.Db) => {
  const Events = db.collection<Event>('events');

  await buildDbIndexes(Events, [
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

  await buildDbIndexes(Events, [
    {
      index: { created: -1 },
      options: { expireAfterSeconds: EVENTS_TTL_SECONDS, name: 'created' },
    },
    { index: { type: 1 }, options: { name: 'type' } },
  ]);

  return Events;
};
