import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { ModuleInput, ModuleMutations, Filter } from '@unchainedshop/types/common';
import { Event, EventsModule } from '@unchainedshop/types/events';
import { getRegisteredEvents } from 'meteor/unchained:events';
import { EventsCollection } from '../db/EventsCollection';
import { EventsSchema } from '../db/EventsSchema';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter';

type FindQuery = {
  types?: Array<string>;
  queryString?: string;
  created?: Date;
};

const SORT_DIRECTIONS = {
  ASC: 1,
  DESC: -1,
};

const buildSortOptions = (sortOptions) => {
  const sortBy = {};
  Object.entries(sortOptions || [])?.forEach(([key, value]: [key: string, value: string]) => {
    sortBy[key] = SORT_DIRECTIONS[value];
  });
  return sortBy;
};

const buildFindSelector = ({ types, queryString, created }: FindQuery) => {
  const selector: { type?: any; $text?: any; created?: any } = {};

  if (types && Array.isArray(types))
    selector.type = { $in: types.map((type) => new RegExp(`^${type}$`), 'i') };
  if (queryString) selector.$text = { $search: queryString };
  if (created) selector.created = { $gte: created };
  return selector;
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

    findEvents: async ({ limit, offset, sort, ...query }) => {
      return Events.find(buildFindSelector(query as FindQuery), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || { created: 'DESC' }),
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
