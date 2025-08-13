import { Context } from '../../../../context.js';
import { EventListOptions } from '../types.js';

const listEvents = async ({ modules }: Context, options?: EventListOptions) => {
  const { limit = 10, offset = 0, queryString, sort, types, created } = options || {};

  const events = await modules.events.findEvents({
    types,
    created,
    queryString,
    limit,
    offset,
    sort,
  });
  return { events };
};

export default listEvents;
