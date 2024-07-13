import type { Filter, FindOptions } from 'mongodb';
import { SortOption } from './api.js';
import { ModuleCreateMutation } from './core.js';
import { TimestampFields } from './common.js';

export type Event = {
  _id?: string;
  type: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
} & TimestampFields;

export type EventReport = {
  count: number;
  event: string;
};

export type EventQuery = {
  types?: Array<string>;
  queryString?: string;
  created?: Date;
};
export interface EventsModule extends ModuleCreateMutation<Event> {
  findEvent: (params: Filter<Event> & { eventId: string }, options?: FindOptions) => Promise<Event>;

  findEvents: (
    params: EventQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: FindOptions,
  ) => Promise<Array<Event>>;

  type: (event: Event) => string;

  count: (query: EventQuery) => Promise<number>;
  getReport: (params?: { from?: Date; to?: Date; type?: string }) => Promise<EventReport[]>;
}
