import {
  Collection,
  Db,
  Filter,
  ObjectId,
  UpdateFilter as Update,
} from 'mongodb';
import { BookmarksModule } from './bookmarks';
import { _ID, ModuleInput, TimestampFields } from './common';
import { CurrenciesModule } from './currencies';
import { CountriesModule } from './countries';
import { LanguagesModule } from './languages';
import { EmitAdapter, EventsModule } from './events';
import { User } from './user';
import { Logger, LogOptions, Transports } from './logs';
import { Locale } from '@types/locale';
import {
  PaymentDirector as IPaymentDirector,
  PaymentProvider,
} from './payments';

// Types package only
export type { Collection, Db, Filter, ObjectId, Update };

export {
  ModuleCreateMutation,
  ModuleMutations,
  _ID,
} from '@unchainedshop/types/common';
export { Modules } from '@unchainedshop/types/modules';

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

  function buildDbIndexes<T>(
    collection: Collection<T>,
    indexes: Array<() => void>
  ): Promise<void>;

  const systemLocale: Locale;

  const Schemas: {
    timestampFields: TimestampFields;
  };
}

declare module 'meteor/unchained:logger' {
  function log(message: string, options?: LogOptions): void;
  function createLogger(
    moduleName: string,
    moreTransports?: Transports
  ): Logger;
}

declare module 'meteor/unchained:events' {
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
  function configureEventsModule(params: ModuleInput): Promise<EventsModule>;
}

declare module 'meteor/unchained:core-bookmarks' {
  function configureBookmarksModule(
    params: ModuleInput
  ): Promise<BookmarksModule>;
}

declare module 'meteor/unchained:core-countries' {
  function configureCountriesModule(
    params: ModuleInput
  ): Promise<CountriesModule>;
}

declare module 'meteor/unchained:core-currencies' {
  function configureCurrenciesModule(
    params: ModuleInput
  ): Promise<CurrenciesModule>;
}

declare module 'meteor/unchained:core-languages' {
  function configureLanguagesModule(
    params: ModuleInput
  ): Promise<LanguagesModule>;
}

declare module 'meteor/unchained:core-payments' {
  function configurePaymentModule(params: ModuleInput): Promise<PaymentModule>;

  function PaymentDirector(
    provider: PaymentProvider,
    context: PaymentContext
  ): IPaymentDirector;
}

declare module 'meteor/unchained:core-users' {
  const Users: Collection<User>;
}

declare module 'meteor/unchained:core-orders' {
  class Orders {
    findOrder({ orderId: string }): any;
  }
}

declare module 'meteor/unchained:mongodb' {
  function initDb(): Db;
}
