import { EventsModule } from 'unchained-core-types';
import { configureEventDirector, EventDirector } from '../director/EventDirector';

type FindQuery = {
  type?: string;
};
const buildFindSelector = ({ type }: FindQuery) => {
  return type ? { type } : {};
};

export const configureEventsModule = (Events: any): EventsModule => ({
  ...configureEventDirector(Events),
  findEvent: async ({ eventId, ...rest }, options) => {
    const selector = eventId ? { _id: eventId } : rest;
    return await Events.findOne(selector, options);
  },

  findEvents: async ({
    limit,
    offset,
    sort = {
      created: -1,
    },
    ...query
  }) => {
    return await Events.find(buildFindSelector(query as FindQuery), {
      skip: offset,
      limit,
      sort,
    }).fetch();
  },

  count: async (query) => {
    const count = await Events.rawCollection().countDocuments(
      buildFindSelector(query)
    );
    return count;
  },
});
