import { BookmarksModule } from './bookmarks';
import {
  Db,
  Collection,
  _ID,
  Filter,
  ModuleInput,
  TimestampFields,
  ModuleMutations,
  ModuleCreateMutation,
} from './common';
import { CurrenciesModule } from './currencies';
import { CountriesModule } from './countries';
import { LanguagesModule } from './languages';
import { EmitAdapter, EventDirector, EventsModule } from './events';
import { User } from './users';
import { Logger, LogLevel as LogLevelType, LogOptions, Transports } from './logs';
import { Locale } from '@types/locale';
import {
  PaymentAdapter as IPaymentAdapter,
  PaymentConfiguration,
  PaymentContext,
  PaymentDirector as IPaymentDirector,
  PaymentModule,
  PaymentError as PaymentErrorType,
  PaymentProvider,
  PaymentProviderType as PaymentProviderTypeType,
} from './payments';
import {
  WarehousingModule,
  WarehousingAdapter as IWarehousingAdapter,
  WarehousingContext,
  WarehousingDirector as IWarehousingDirector,
  WarehousingError as WarehousingErrorType,
  WarehousingProvider,
  WarehousingProviderTypeType as WarehousingProviderTypeTypeType,
} from './warehousing';
import { Request } from 'express';
import {
  FileDirector,
  FilesModule,
  IFileAdapter,
  UploadFileCallback,
  UploadFileData,
} from './files';
import exp from 'constants';

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
  export function log(message: string, options?: LogOptions): void;
  export function createLogger(
    moduleName: string,
    moreTransports?: Transports
  ): Logger;

  export const LogLevel: typeof LogLevelType;
}

declare module 'meteor/unchained:events' {
  export function emit(
    eventName: string,
    data?: string | Record<string, unknown>
  ): Promise<void>;
  export function getEmitAdapter(): EmitAdapter;
  export function getEmitHistoryAdapter(): EmitAdapter;
  export function getRegisteredEvents(): string[];
  export function registerEvents(events: string[]): void;
  export function setEmitAdapter(adapter: EmitAdapter): void;
  export function setEmitHistoryAdapter(adapter: EmitAdapter): void;
  export function subscribe(
    eventName: string,
    callBack: (payload?: Record<string, unknown>) => void
  ): void;
}

declare module 'meteor/unchained:core-events' {
  export function configureEventsModule(
    params: ModuleInput
  ): Promise<EventsModule>;
}

declare module 'meteor/unchained:core-files-next' {
  export function configureFilesModule(
    params: ModuleInput
  ): Promise<FilesModule>;

  export const fileServices: any;
}

declare module 'meteor/unchained:core-bookmarks' {
  export function configureBookmarksModule(
    params: ModuleInput
  ): Promise<BookmarksModule>;
  export const bookmarkServices: any;
}

declare module 'meteor/unchained:core-countries' {
  export function configureCountriesModule(
    params: ModuleInput
  ): Promise<CountriesModule>;
  export const countryServices: any;
}

declare module 'meteor/unchained:core-currencies' {
  export function configureCurrenciesModule(
    params: ModuleInput
  ): Promise<CurrenciesModule>;
}

declare module 'meteor/unchained:core-discounting' {
  export const DiscountAdapter;
  export const DiscountDirector;
}

declare module 'meteor/unchained:core-languages' {
  function configureLanguagesModule(
    params: ModuleInput
  ): Promise<LanguagesModule>;
}

declare module 'meteor/unchained:core-payments' {
  export function configurePaymentModule(
    params: ModuleInput
  ): Promise<PaymentModule>;
  export const paymentServices;

  export function PaymentDirector(
    provider: PaymentProvider,
    context: PaymentContext
  ): IPaymentDirector;

  export function registerAdapter(adapter: typeof IPaymentAdapter): void;
  export function getAdapter(key: string): typeof IPaymentAdapter;

  export class PaymentAdapter implements IPaymentAdapter {
    static key: string;
    static label: string;
    static version: string;
    static typeSupported: (type: PaymentProviderTypeType) => boolean;

    public config: PaymentConfiguration | null;
    public context: PaymentContext | null;

    constructor(config: PaymentConfiguration, context: PaymentContext);
  }
  export const PaymentError: typeof PaymentErrorType;

  export const paymentLogger;

  export const PaymentProviderType: typeof PaymentProviderTypeType;
}

declare module 'meteor/unchained:core-warehousing' {
  export function configureWarehousingModule(
    params: ModuleInput
  ): Promise<WarehousingModule>;

  export function WarehousingDirector(
    provider: WarehousingProvider
  ): IWarehousingDirector;

  export function registerWarehousingAdapter(
    adapter: typeof IWarehousingAdapter
  ): void;
  export function getWarehousingAdapter(
    key: string
  ): typeof IWarehousingAdapter;

  export class WarehousingAdapter implements IWarehousingAdapter {
    static key: string;
    static label: string;
    static version: string;
    static typeSupported: (type: WarehousingProviderTypeType) => boolean;

    public config: WarehousingProvider['configuration'];
    public context: WarehousingContext;

    constructor(
      config: WarehousingProvider['configuration'],
      context: WarehousingContext
    );
  }
  export const WarehousingError: typeof WarehousingErrorType;

  export const WarehousingProviderType: typeof WarehousingProviderTypeType;
}

declare module 'meteor/unchained:file-upload' {
  export const setFileUploadAdapter: FileDirector['setFileAdapter'];
  export const getFileUploadAdapter: FileDirector['getFileAdapter'];

  export const composeFileName: FileDirector['composeFileName'];
  export const createSignedURL: FileDirector['createSignedURL'];

  export const registerFileUploadCallback: FileDirector['registerFileUploadCallback'];
  export const getFileUploadCallback: FileDirector['getFileUploadCallback'];

  export const removeFiles = FileDirector['removeFiles'];
  export const uploadFileFromStream: FileDirector['uploadFileFromStream'];
  export const uploadFileFromURL: FileDirector['uploadFileFromStream'];
}

declare module 'meteor/unchained:core-users' {
  export function configureUsersModule(
    params: ModuleInput
  ): Promise<UsersModule>;
}

declare module 'meteor/unchained:core-orders' {
  export const Orders: {
    findOrder({ orderId: string }): any;
  };
}

declare module 'meteor/unchained:core-products' {
  export const Products: {
    productExists({ productId: string }): any;
  };
}

declare module 'meteor/unchained:mongodb' {
  export function initDb(): Db;
}
