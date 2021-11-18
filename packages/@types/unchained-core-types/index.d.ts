import winston from 'winston';
import { Collection, Db } from 'mongodb';
import { _ID } from '.';
import { ModuleInput } from './common';
import { EventsModule } from './events';
import { BookmarksModule } from './bookmarks';
import { log, createLogger, format, transports, LogLevel } from './logs';

// Types package only
export { Modules } from './modules';
export type {
  Db,
  Collection,
  UpdateFilter as Update,
  Filter,
  ObjectId,
} from 'mongodb';
export { ModuleMutations, ModuleCreateMutation, _ID } from './common';

declare module 'meteor/unchained:utils' {
  function checkId(
    value: string,
    error?:
      | {
          message: string;
          path?: string | undefined;
        }
      | undefined
  ): void;

  function generateDbFilterById(id: any): Filter<{ _id?: _ID }>;

  function generateDbMutations<T extends { _id?: _ID }>(
    collection: Collection<T>,
    schema: SimpleSchema,
    options?: { hasCreateOnly: boolean }
  ): ModuleMutations<T> | ModuleCreateMutation<T>;
}

export interface EmitAdapter {
  publish(eventName: string, payload: Record<string, unknown>): void;
  subscribe(
    eventName: string,
    callBack: (payload?: Record<string, unknown>) => void
  ): void;
}


declare module 'meteor/unchained:logs' {
  export {
    log, createLogger, format, transports, LogLevel
  }
}


declare module 'unchained-events' {
  function emit(
    eventName: string,
    data?: string | Record<string, unknown>
  ): Promise<void>;
  function getEmitAdapter(): EmitAdapter;
  function getEmitHistoryAdapter(): EmitAdapter;
  function getRegisteredEvents(): string[];
  function registerEvents(events: string[]): void;
  function setEmitAdapter(adapter: EmitAdapter): void;
  function setEmitHistoryAdapter(adapter: EmitAdapter): void;
  function subscribe(
    eventName: string,
    callBack: (payload?: Record<string, unknown>) => void
  ): void;
}

declare module 'meteor/unchained:core-events' {
  function configureEventsModule(
    params: ModuleInput
  ): Promise<EventsModule>;
}

declare module 'meteor/unchained:core-bookmarks' {
  function configureBookmarksModule(
    params: ModuleInput
  ): Promise<BookmarksModule>;
}

declare module 'meteor/unchained:core-users' {
  class Users {}
}

declare module 'meteor/unchained:core-orders' {
  class Orders {
    findOrder({ orderId: string }): any;
  }
}

declare module 'meteor/unchained:mongodb' {
  function initDb(): Db;
}
