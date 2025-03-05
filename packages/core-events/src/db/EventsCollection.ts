import { mongodb } from '@unchainedshop/mongodb';
import { buildDbIndexes } from '@unchainedshop/mongodb';
import { TimestampFields } from '@unchainedshop/mongodb';

const TWO_DAYS_SEC = 172800;

export type Event = {
  _id?: string;
  type: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
} & TimestampFields;

export const EventsCollection = async (db: mongodb.Db) => {
  const Events = db.collection<Event>('events');

  await buildDbIndexes(Events, [
    {
      index: { created: -1 },
      options: { expireAfterSeconds: TWO_DAYS_SEC, name: 'created' },
    },
    { index: { type: 1 }, options: { name: 'type' } },
    // {
    //   index: { _id: 'text', type: 'text' },
    //   options: {
    //     weights: {
    //       _id: 8,
    //       type: 4,
    //     },
    //     name: 'events_fulltext_search',
    //   },
    // },
  ]);

  return Events;
};
