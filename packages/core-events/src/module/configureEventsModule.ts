import { Filter } from 'unchained-core-types';
import { Event, EventsModule } from 'unchained-core-types/lib/events';
import { ModuleInput } from 'unchained-core-types/types/common';
import { generateDbMutations } from 'unchained-utils';
import { EventsCollection } from '../db/EventsCollection';
import { EventsSchema } from '../db/EventsSchema';
import { configureEventDirector } from '../director/EventDirector';

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

  return {
    ...configureEventDirector(Events),

    findEvent: async ({ eventId, ...rest }, options) => {
      const selector = eventId ? { _id: eventId } : rest;
      if (!Object.keys(selector)?.length) return null;
      return await Events.findOne(
        selector as unknown as Filter<Event>,
        options
      );
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

    ...generateDbMutations(Events, EventsSchema),
  };
};
