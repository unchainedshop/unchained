import { Filter } from 'unchained-core-types';
import { Event, EventHistoryModule } from 'unchained-core-types/events';
import { ModuleInput } from 'unchained-core-types/common';
import { generateDbMutations } from 'meteor/unchained:utils';
import { EventsCollection } from '../db/EventsCollection';
import { EventsSchema } from '../db/EventsSchema';

type FindQuery = {
  type?: string;
};
const buildFindSelector = ({ type }: FindQuery) => {
  return type ? { type } : {};
};

export const configureEventHistoryModule = async ({
  db,
}: ModuleInput): Promise<EventHistoryModule> => {
  const Events = await EventsCollection(db);

  return {
    findEvent: async ({ eventId, ...rest }, options) => {
      const selector = eventId ? { _id: eventId } : rest;
      if (!Object.keys(selector)?.length) return null;
      return Events.findOne(selector as unknown as Filter<Event>, options);
    },

    findEvents: async ({
      limit,
      offset,
      sort = {
        created: -1,
      },
      query,
    }) => {
      const events = Events.find(buildFindSelector(query as FindQuery), {
        skip: offset,
        limit,
        sort,
      });

      return events.toArray();
    },

    count: async (query) => {
      const count = await Events.countDocuments(buildFindSelector(query));
      return count;
    },

    ...generateDbMutations(Events, EventsSchema, { hasCreateOnly: true }),
  };
};
