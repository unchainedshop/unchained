import { Db } from '@unchainedshop/types/common';
import { Event } from '@unchainedshop/types/events';
import { buildDbIndexes } from 'meteor/unchained:utils';

const TWO_DAYS_SEC = 172800;

export const EventsCollection = async (db: Db) => {
  const Events = db.collection<Event>('events');

  await buildDbIndexes(Events, [
    {
      index: { created: -1 },
      options: { expireAfterSeconds: TWO_DAYS_SEC, name: 'created' },
    },
    { index: { type: 1 }, options: { name: 'type' } },
  ]);

  return Events;
};
