import type { Context } from '../../../../context.ts';
import type { EventListOptions } from '../types.ts';

const listEvents = async ({ services }: Context, options?: EventListOptions) => {
  const { limit = 10, offset = 0, queryString, sort, types, created } = options || {};

  const events = await services.events.searchEvents(queryString, {
    types,
    created,
    limit,
    offset,
    sort,
  });
  return { events };
};

export default listEvents;
