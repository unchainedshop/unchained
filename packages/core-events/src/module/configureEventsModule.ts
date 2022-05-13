import { generateDbFilterById, generateDbMutations, buildSortOptions } from 'meteor/unchained:utils';
import { ModuleInput, ModuleMutations, Filter } from '@unchainedshop/types/common';
import { Event, EventQuery, EventsModule } from '@unchainedshop/types/events';
import { getRegisteredEvents } from 'meteor/unchained:events';
import { EventsCollection } from '../db/EventsCollection';
import { EventsSchema } from '../db/EventsSchema';
import { configureEventHistoryAdapter } from './configureEventHistoryAdapter';

const buildFindSelector = ({ types, queryString, created }: EventQuery) => {
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
      return Events.findOne(selector as unknown as Filter<Event>, options);
    },

    findEvents: async ({ limit, offset, sort, ...query }) => {
      return Events.find(buildFindSelector(query as Event), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || [{ key: 'created', value: 'DESC' }]),
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
