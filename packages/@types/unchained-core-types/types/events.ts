import { FindOptions, Sort } from 'mongodb';
import { ModuleMutations, Query, TimestampFields, _ID } from './common';

export type Event = {
  _id?: _ID;
  type: string;
  payload?: object;
} & TimestampFields;

export type ContextNormalizerFunction = (context: any) => any;

export interface EventAdapter {
  publish(eventName: string, payload: any): void;
  subscribe(eventName: string, callBack: (payload?: any) => void): void;
}

export interface EventDirector {
  emit: (eventName: string, data: any) => Promise<void>;
  getRegisteredEvents: () => string[];
  registerEvents: (events: string[]) => void;
  setContextNormalizer: (fn: ContextNormalizerFunction) => void;
  setEventAdapter: (adapter: EventAdapter) => void;
  subscribe: (eventName: string, callBack: () => void) => void;
}
export interface EventsModule extends EventDirector, ModuleMutations<Event> {
  findEvent: (
    params: { eventId: number; query: Query },
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
