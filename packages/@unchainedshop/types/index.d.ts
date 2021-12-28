import { Locale, Locales } from '@types/locale';
import { ObjectId } from 'bjson';
import { Request } from 'express';
import SimpleSchema from 'simpl-schema';
import { AssortmentsModule } from './assortments';
import { BookmarksModule } from './bookmarks';
import {
  Collection,
  Db,
  Document,
  Filter,
  IBaseAdapter,
  IBaseDirector,
  Indexes,
  ModuleCreateMutation,
  ModuleInput,
  ModuleMutations,
  Query,
  TimestampFields,
  _ID,
} from './common';
import { CountriesModule, Country } from './countries';
import { CurrenciesModule } from './currencies';
import {
  DeliveryModule,
  IDeliveryAdapter,
  IDeliveryDirector,
  DeliveryProviderType as DeliveryProviderTypeType,
  DeliveryError as DeliveryErrorType,
} from './delivery';
import {
  IDeliveryPricingAdapter,
  IDeliveryPricingDirector,
} from './delivery.pricing';
import { EventDirector, EventsModule } from './events';
import { FileDirector, FilesModule } from './files';
import { LanguagesModule } from './languages';
import {
  Logger,
  LogLevel as LogLevelType,
  LogOptions,
  Transports,
} from './logs';
import { IDiscountAdapter, IDiscountDirector } from './orders.discount';
import {
  IOrderPricingAdapter,
  IOrderPricingDirector,
  IOrderPricingSheet,
} from './orders.pricing';
import {
  IPaymentAdapter,
  IPaymentDirector,
  PaymentError as PaymentErrorType,
  PaymentModule,
  PaymentProviderType as PaymentProviderTypeType,
} from './payments';
import {
  IPaymentPricingAdapter,
  IPaymentPricingDirector,
} from './payments.pricing';
import {
  BasePricingAdapterContext,
  BasePricingContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
  PricingSheetParams,
} from './pricing';
import { ProductsModule, ProductType } from './products';
import {
  IProductPricingAdapter,
  IProductPricingDirector,
} from './products.pricing';
import { UsersModule } from './user';
import {
  IWarehousingAdapter,
  IWarehousingDirector,
  WarehousingError as WarehousingErrorType,
  WarehousingModule,
  WarehousingProviderType as WarehousingProviderTypeType,
} from './warehousing';
import { WorkerModule, IWorkerAdapter, IWorkerDirector } from './worker';

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

  function dbIdToString(_id: _ID): string;

  function findUnusedSlug(
    checkSlugIsUniqueFn: (slug: string) => Promise<boolean>,
    options: { slugify?: (text: string) => string }
  ): (params: {
    title?: string;
    existingSlug: string;
    newSlug?: string;
  }) => Promise<string>;

  function findLocalizedText<T>(
    collection: Collection<T>,
    selector: Query,
    locale: string | Locale
  ): Promise<T>;

  function generateId(id: unknown): ObjectId;
  function generateDbFilterById<T extends { _id?: _ID }>(
    id: any,
    query?: Filter<T>
  ): Filter<T>;

  function generateDbMutations<T extends { _id?: _ID }>(
    collection: Collection<T>,
    schema: SimpleSchema,
    options?: { hasCreateOnly: boolean }
  ): ModuleMutations<T> | ModuleCreateMutation<T>;

  function buildDbIndexes<T extends Document>(
    collection: Collection<T>,
    indexes: Indexes<T>
  ): Promise<boolean>;

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

  function objectInvert(obj: Record<string, string>): Record<string, string>;

  const systemLocale: Locale;

  const Schemas: {
    timestampFields: TimestampFields;
  };

  // Director
  export const BaseDirector: <Adapter extends IBaseAdapter>(
    directorName: string,
    options?: {
      adapterSortKey?: string;
      adapterKeyField?: string;
    }
  ) => IBaseDirector<Adapter>;
  export const BasePricingAdapter: <
    AdapterContext extends BasePricingAdapterContext,
    Calculation extends PricingCalculation
  >() => IPricingAdapter<
    AdapterContext,
    Calculation,
    IPricingSheet<Calculation>
  >;
  export const BasePricingDirector: <
    Context extends BasePricingContext,
    AdapterContext extends BasePricingAdapterContext,
    Calculation extends PricingCalculation,
    Adapter extends IPricingAdapter<
      AdapterContext,
      Calculation,
      IPricingSheet<Calculation>
    >
  >(
    directorName: string
  ) => IPricingDirector<Context, AdapterContext, Calculation, Adapter>;

  export const BasePricingSheet: <Calculation extends PricingCalculation>(
    params: PricingSheetParams<Calculation>
  ) => IPricingSheet<Calculation>;
}

declare module 'meteor/unchained:logger' {
  export function log(message: string, options?: LogOptions): void;
  export function createLogger(
    moduleName: string,
    moreTransports?: Transports
  ): Logger;

  export const LogLevel: typeof LogLevelType;
}

/*
 * Director packages
 */

declare module 'meteor/unchained:events' {
  export const emit: EventDirector['emit'];
  export const getEmitAdapter: EventDirector['getEmitAdapter'];
  export const getEmitHistoryAdapter: EventDirector['getEmitHistoryAdapter'];
  export const getRegisteredEvents: EventDirector['getRegisteredEvents'];
  export const registerEvents: EventDirector['registerEvents'];
  export const setEmitAdapter: EventDirector['setEmitAdapter'];
  export const setEmitHistoryAdapter: EventDirector['setEmitHistoryAdapter'];
  export const subscribe: EventDirector['subscribe'];
}

declare module 'meteor/unchained:director-file-upload' {
  export const setFileUploadAdapter: FileDirector['setFileUploadAdapter'];
  export const getFileUploadAdapter: FileDirector['getFileUploadAdapter'];

  export const composeFileName: FileDirector['composeFileName'];
  export const createSignedURL: FileDirector['createSignedURL'];

  export const registerFileUploadCallback: FileDirector['registerFileUploadCallback'];
  export const getFileUploadCallback: FileDirector['getFileUploadCallback'];

  export const removeFiles = FileDirector['removeFiles'];
  export const uploadFileFromStream: FileDirector['uploadFileFromStream'];
  export const uploadFileFromURL: FileDirector['uploadFileFromStream'];
}

/*
 * Core packages
 */

declare module 'meteor/unchained:core-assortments' {
  export function configureAssortmentsModule(
    params: ModuleInput
  ): Promise<AssortmentsModule>;
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

declare module 'meteor/unchained:core-delivery' {
  export function configureDeliveryModule(
    params: ModuleInput
  ): Promise<DeliveryModule>;

  export const DeliveryAdapter: IDeliveryAdapter;
  export const DeliveryDirector: IDeliveryDirector;
  export const DeliveryProviderType: typeof DeliveryProviderTypeType;
  export const DeliveryError: typeof DeliveryErrorType;

  export const DeliveryPricingAdapter: IDeliveryPricingAdapter;
  export const DeliveryPricingDirector: IDeliveryPricingDirector;
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

declare module 'meteor/unchained:core-languages' {
  function configureLanguagesModule(
    params: ModuleInput
  ): Promise<LanguagesModule>;
}

declare module 'meteor/unchained:core-orders' {
  export const Orders: {
    findOrder({ orderId: string }): any;
  };

  export const DiscountAdapter: IDiscountAdapter;
  export const DiscountDirector: IDiscountDirector;

  export const OrderPricingAdapter: IOrderPricingAdapter;
  export const OrderPricingDirector: IOrderPricingDirector;
  export const OrderPricingSheet: IOrderPricingSheet;
}

declare module 'meteor/unchained:core-payment' {
  export function configurePaymentModule(
    params: ModuleInput
  ): Promise<PaymentModule>;
  export const paymentServices;

  export const PaymentDirector: IPaymentDirector;
  export const PaymentAdapter: IPaymentAdapter;

  export const PaymentPricingAdapter: IPaymentPricingAdapter;
  export const PaymentPricingDirector: IPaymentPricingDirector;

  export const PaymentError: typeof PaymentErrorType;
  export const PaymentProviderType: typeof PaymentProviderTypeType;

  export const paymentLogger;
}

declare module 'meteor/unchained:core-products' {
  export function configureProductsModule(
    params: ModuleInput
  ): Promise<ProductsModule>;

  export const ProductPricingAdapter: IProductPricingAdapter;
  export const ProductPricingDirector: IProductPricingDirector;

  export const ProductTypes: typeof ProductType;
}

declare module 'meteor/unchained:core-warehousing' {
  export function configureWarehousingModule(
    params: ModuleInput
  ): Promise<WarehousingModule>;

  export const WarehousingDirector: IWarehousingDirector;
  export const WarehousingAdapter: IWarehousingAdapter;
  export const WarehousingError: typeof WarehousingErrorType;
  export const WarehousingProviderType: typeof WarehousingProviderTypeType;
}

declare module 'meteor/unchained:core-worker' {
  export function configureWorkerModule(
    params: ModuleInput
  ): Promise<WorkerModule>;

  export const WorkerDirector: IWorkerDirector;
  export const WorkerAdapter: IWorkerAdapter;
}

declare module 'meteor/unchained:core-users' {
  export function configureUsersModule(
    params: ModuleInput
  ): Promise<UsersModule>;
}

declare module 'meteor/unchained:mongodb' {
  export function initDb(): Db;
}
