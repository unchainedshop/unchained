import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { EventQuery } from '@unchainedshop/core-events';
import type { SortOption } from '@unchainedshop/utils';

export async function searchEventsService(
  this: Modules,
  queryString?: string,
  query: EventQuery & { limit?: number; offset?: number; sort?: SortOption[] } = {},
) {
  if (!queryString) {
    return this.events.findEvents(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchEventIds = await searchActions.search('events');
  if (searchEventIds.length === 0) return [];

  return this.events.findEvents({ ...query, searchEventIds });
}

export async function searchEventsCountService(
  this: Modules,
  queryString?: string,
  query: EventQuery = {},
) {
  if (!queryString) {
    return this.events.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchEventIds = await searchActions.search('events');
  if (searchEventIds.length === 0) return 0;

  return this.events.count({ ...query, searchEventIds });
}
