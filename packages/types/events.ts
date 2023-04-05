import type { Filter, FindOptions } from 'mongodb';
import { SortOption } from './api.js';
import { TimestampFields } from './common.js';
import { ModuleCreateMutation } from './core.js';

export type EventPayload = {
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

export type Event = {
  _id?: string;
  type: string;
} & EventPayload &
  TimestampFields;

export type EventQuery = {
  types?: Array<string>;
  queryString?: string;
  created?: Date;
};

export interface EmitAdapter {
  publish(eventName: string, data: EventPayload): void;
  subscribe(eventName: string, callback: (payload?: Record<string, unknown>) => void): void;
}
export type ContextNormalizerFunction = (context: any) => any;

export interface EventDirector {
  emit: (eventName: string, data?: string | Record<string, unknown>) => Promise<void>;
  getEmitAdapter: () => EmitAdapter;
  getEmitHistoryAdapter: () => EmitAdapter;
  getRegisteredEvents: () => string[];
  registerEvents: (events: string[]) => void;
  setContextNormalizer: (fn: ContextNormalizerFunction) => void;
  setEmitAdapter: (adapter: EmitAdapter) => void;
  setEmitHistoryAdapter: (adapter: EmitAdapter) => void;
  subscribe: (eventName: string, callback: (payload?: Record<string, unknown>) => void) => void;
}

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
