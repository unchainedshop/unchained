import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { ModuleInput, ModuleMutations, Filter } from '@unchainedshop/types/common';
import { Event, EventsModule } from '@unchainedshop/types/events';
import { getRegisteredEvents } from 'meteor/unchained:events';
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
}: ModuleInput<Record<string, never>>): Promise<EventsModule> => {
  const Events = await EventsCollection(db);

  const mutations = generateDbMutations<Event>(Events, EventsSchema, {
    hasCreateOnly: true,
  }) as ModuleMutations<Event>;

  configureEventHistoryAdapter(mutations);

  return {
    ...mutations,
    findEvent: async ({ eventId, ...rest }, options) => {
      const selector = eventId ? generateDbFilterById(eventId) : rest;
      return Events.findOne(selector as unknown as Filter<Event>, options);
    },

    findEvents: async ({
      limit,
      offset,
      sort = {
        created: -1,
      },
      ...query
    }) => {
      return Events.find(buildFindSelector(query as FindQuery), {
        skip: offset,
        limit,
        sort,
      }).toArray();
    },

    type: (event) => {
      if (getRegisteredEvents().includes(event.type)) {
        return event.type;
      }
      return 'UNKNOWN';
    },

    count: async (query) => {
      const count = await Events.countDocuments(buildFindSelector(query));
      return count;
    },
  };
};
