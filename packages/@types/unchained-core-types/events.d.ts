import { FindOptions, Sort } from 'mongodb';
import { ModuleCreateMutation, Query, TimestampFields, _ID } from './common';

export type Event = {
  _id?: _ID;
  type: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
} & TimestampFields;

export interface EmitAdapter {
  publish(eventName: string, payload: Record<string, unknown>): void;
  subscribe(
    eventName: string,
    callBack: (payload?: Record<string, unknown>) => void
  ): void;
}

export interface EventsModule extends ModuleCreateMutation<Event> {
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
