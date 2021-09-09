import { EventsModule } from 'unchained-core-types';

type FindQuery = {
  type?: string;
};
const buildFindSelector = ({ type }: FindQuery) => {
  return type ? { type } : {};
};

export const configureEventsModule = (Events: any, EventDirector: any): EventsModule => ({
  ...EventDirector,
  findEvent: async ({ eventId, ...rest }, options) => {
    const selector = eventId ? { _id: eventId } : rest;
    return Events.findOne(selector, options);
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
    }).fetch();
  },

  count: async (query) => {
    const count = await Events.rawCollection().countDocuments(
      buildFindSelector(query)
    );
    return count;
  },
});
