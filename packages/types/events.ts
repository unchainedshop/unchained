import type { Filter, FindOptions } from 'mongodb';
import { SortOption } from './api.js';
import { TimestampFields } from './common.js';
import { ModuleCreateMutation } from './core.js';

export type Event = {
  _id?: string;
  type: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
} & TimestampFields;

export interface EmitAdapter {
  publish(eventName: string, data: Pick<Event, 'context' | 'payload'>): void;
  subscribe(eventName: string, callback: (payload?: Record<string, unknown>) => void): void;
}

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
}
