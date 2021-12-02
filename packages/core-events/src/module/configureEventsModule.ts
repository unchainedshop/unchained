import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { ModuleInput, Filter } from '@unchainedshop/types/common';
import { Event, EventsModule } from '@unchainedshop/types/events';
import { EventsCollection } from '../db/EventsCollection';
import { EventsSchema } from '../db/EventsSchema';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter';

type FindQuery = {
  type?: string;
};
const buildFindSelector = ({ type }: FindQuery) => {
  return type ? { type } : {};
};

export const configureEventsModule = async ({
  db,
}: ModuleInput): Promise<EventsModule> => {
  const Events = await EventsCollection(db);

  configureEventHistoryAdapter(Events);

  return {
    findEvent: async ({ eventId, ...rest }, options) => {
      const selector = eventId ? generateDbFilterById(eventId) : rest;
      if (!Object.keys(selector)?.length) return null;
      return await Events.findOne(selector as unknown as Filter<Event>, options);
    },

    findEvents: async ({
      limit,
      offset,
      sort = {
        created: -1,
      },
      ...query
    }) => {
      const events = Events.find(buildFindSelector(query as FindQuery), {
        skip: offset,
        limit,
        sort,
      });

      return await events.toArray();
    },

    count: async (query) => {
      const count = await Events.countDocuments(buildFindSelector(query));
      return count;
    },

    ...generateDbMutations(Events, EventsSchema, { hasCreateOnly: true }),
  };
};
