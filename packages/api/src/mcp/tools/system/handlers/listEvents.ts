import type { SortOption } from '@unchainedshop/utils';
import type { Context } from '../../../../context.ts';

export interface EventListOptions {
  limit?: number;
  offset?: number;
  queryString?: string;
  types?: string[];
  sort?: SortOption[];
  created?: {
    start?: Date;
    end?: Date;
  };
}

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
