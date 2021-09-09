import { Query, TimestampFields } from './common';

export type Event = {
  type: string;
  payload?: object;
} & TimestampFields;

export interface EventDirector {
  emit: (eventName: string, data: any) => Promise<void>;
  getRegisteredEvents: () => string[];
  registerEvents: (events: string[]) => void;
  setContextNormalizer: (fn: ContextNormalizerFunction) => void;
  setEventAdapter: (adapter: EventAdapter) => void;
  subscribe: (eventName: string, callBack: () => void) => void;
}
export interface EventsModule extends EventDirector {
  findEvent: (
    params: { eventId: number; query: { [x: string]: any } },
    options?: object
  ) => Promise<Event>;

  findEvents: (params: {
    limit?: number;
    offset?: number;
    sort?: object;
    query: Query;
  }) => Promise<Array<Event>>;

  count: (query: Query) => Promise<number>;
}
