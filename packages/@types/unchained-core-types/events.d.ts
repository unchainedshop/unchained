import { FindOptions, Sort } from 'mongodb';
import { ModuleCreateMutation, Query, TimestampFields, _ID } from './common';

export type Event = {
  _id?: _ID;
  type: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
} & TimestampFields;

export type ContextNormalizerFunction = (context: any) => any;

export interface EventAdapter {
  publish(eventName: string, payload: Record<string, unknown>): void;
  subscribe(
    eventName: string,
    callBack: (payload?: Record<string, unknown>) => void
  ): void;
}
export interface EventDirector {
  emit: (
    eventName: string,
    data: string | Record<string, unknown>
  ) => Promise<void>;
  getRegisteredEvents: () => string[];
  registerEvents: (events: string[]) => void;
  setContextNormalizer: (fn: ContextNormalizerFunction) => void;
  setEventAdapter: (adapter: EventAdapter) => void;
  subscribe: (eventName: string, callBack: () => void) => void;
}

export interface EventHistoryModule extends ModuleCreateMutation<Event> {
  findEvent: (
    params: { eventId: _ID; query?: Query },
    options?: FindOptions
  ) => Promise<Event>;

  findEvents: (params: {
    limit?: number;
    offset?: number;
    sort?: Sort;
    query: Query;
  }) => Promise<Array<Event>>;

  count: (query: Query) => Promise<number>;
}
