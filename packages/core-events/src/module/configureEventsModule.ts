import type { mongodb } from '@unchainedshop/mongodb';

import { generateDbFilterById, generateDbMutations, buildSortOptions } from '@unchainedshop/mongodb';
import { Event, EventQuery, EventsModule } from '@unchainedshop/types/events.js';
import { getRegisteredEvents } from '@unchainedshop/events';
import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import { EventsCollection } from '../db/EventsCollection.js';
import { EventsSchema } from '../db/EventsSchema.js';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter.js';

export const buildFindSelector = ({ types, queryString, created }: EventQuery) => {
  const selector: { type?: any; $text?: any; created?: any } = {};

  if (types && Array.isArray(types)) selector.type = { $in: types };
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
      return Events.findOne(selector as unknown as mongodb.Filter<Event>, options);
    },

    findEvents: async ({ limit, offset, sort, ...query }) => {
      const defaultSort = [{ key: 'created', value: SortDirection.DESC }] as Array<SortOption>;
      return Events.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
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
