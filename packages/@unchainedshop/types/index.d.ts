import { BookmarksModule } from './bookmarks';
import {
  Db,
  Collection,
  _ID,
  Filter,
  ModuleInput,
  TimestampFields,
} from './common';
import { CurrenciesModule } from './currencies';
import { CountriesModule } from './countries';
import { LanguagesModule } from './languages';
import { EmitAdapter, EventsModule } from './events';
import { User } from './user';
import { Logger, LogOptions, Transports } from './logs';
import { Locale } from '@types/locale';
import {
  PaymentAdapter as IPaymentAdapter,
  PaymentConfiguration,
  PaymentContext,
  PaymentDirector as IPaymentDirector,
  PaymentProvider,
  PaymentProviderType,
} from './payments';
import { Request } from 'express';
import { FilesModule, IFileAdapter, UploadFileData } from './files';

export { Modules } from './modules';

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

  function generateDbFilterById<T extends { _id?: _ID }>(
    id: any,
    query?: Filter<T>
  ): Filter<T>;

  function generateDbMutations<T extends { _id?: _ID }>(
    collection: Collection<T>,
    schema: SimpleSchema,
    options?: { hasCreateOnly: boolean }
  ): ModuleMutations<T> | ModuleCreateMutation<T>;

  function buildDbIndexes<T>(
    collection: Collection<T>,
    indexes: Array<() => void>
  ): Promise<void>;

  function resolveBestSupported(language: string, locales: Locales): Locale;
  function resolveBestCountry(
    contextCountry: string,
    headerCountry: string | string[],
    countries: Array<Country>
  ): string;
  function resolveUserRemoteAddress(req: Request): {
    remoteAddress: string;
    remotePort: string;
  };

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
  const LogLevel;
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

declare module 'meteor/unchained:core-files-next' {
  function configureFilesModule(params: ModuleInput): Promise<FilesModule>;

  function setFileAdapter(adapter: FileAdapter): void;
  function getFileAdapter(): FileAdapter;

  function composeFileName(file: File): string;
  function createSignedURL(
    directoryName: string,
    fileName: string
  ): Promise<UploadFileData | null>;
  function registerFileUpload(
    directoryName: string,
    fn: (params: any) => Promise<any>
  ): void;
  function removeFiles(fileIds: string | Array<string>): Promise<number>;
  function uploadFileFromStream(
    directoryName: string,
    rawFile: any
  ): Promise<UploadFileData | null>;
  function uploadFileFromURL(
    directoryName: string,
    file: { fileLink: string; fileName: string }
  ): Promise<UploadFileData | null>;
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
  const paymentServices;

  function PaymentDirector(
    provider: PaymentProvider,
    context: PaymentContext
  ): IPaymentDirector;

  function registerAdapter(adapter: IPaymentAdapter): void;
  function getAdapter(key: string): IPaymentAdapter;

  class PaymentAdapter implements IPaymentAdapter {
    static key: string;
    static label: string;
    static version: string;
    static typeSupported: (type: PaymentProviderType) => boolean;

    public config: PaymentConfiguration | null;
    public context: PaymentContext | null;

    constructor(config: PaymentConfiguration, context: PaymentContext);
  }
  const PaymentError;

  const paymentLogger;

  const PaymentProviderType;
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
