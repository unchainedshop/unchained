import { FindOptions, Sort } from 'mongodb';
import { ModuleCreateMutation, Query, TimestampFields, _ID } from '@unchainedshop/types/common';

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
  findEvent: (params: Query & { eventId: _ID }) => Promise<Event>;

  findEvents: (
    params: Query & {
      limit?: number;
      offset?: number;
      sort?: Sort;
    }
  ) => Promise<Array<Event>>;

  count: (query: Query) => Promise<number>;
}
