import winston from 'winston';
import { _ID } from './';
import { ModuleInput } from './common';
import { LogsModule, LogLevel } from './logs';
import { EventDirector, EventAdapter, EventsModule } from './events';
import { Collection } from 'mongodb';

// Types package only
export { Modules } from './modules';
export type {
  Db,
  Collection,
  UpdateFilter as Update,
  Filter,
  ObjectId,
} from 'mongodb';
export { ModuleMutations, _ID } from './';

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
    schema: SimpleSchema
  ): ModuleMutations<T>;
}

declare module 'meteor/unchained:core-logger' {
  function configureLogs({ db }: ModuleInput): Promise<LogsModule>;
  function log(message: string, options: LogOptions): void;
  function createLogger(
    moduleName: string,
    moreTransports: Array<TransportStream> = []
  ): winston.Logger;
  const LogLevel;
}

declare module 'meteor/unchained:core-events' {
  function registerEvents(events: Array<string>): void;
  function emitEvent(event: string, data: any): Promise<void>;
  function configureEvent({ db }: ModuleInput): Promise<EventsModule>;
  EventDirector;
  EventAdapter;
}

declare module 'meteor/unchained:core-users' {
  class Users {};
}

declare module 'meteor/unchained:core-orders' {
  class Orders {}
}
