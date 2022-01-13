import { ApolloServer } from 'apollo-server-express';
import { Request } from 'express';
import { Locale, Locales } from 'locale';
import SimpleSchema from 'simpl-schema';
import { AccountsModule, AccountsOptions } from './accounts';
import { Context, UnchainedCoreOptions, UnchainedServerOptions } from './api';
import { AssortmentsModule } from './assortments';
import { BookmarkServices, BookmarksModule } from './bookmarks';
import {
  Collection,
  Db,
  Document,
  Filter,
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  Indexes,
  ModuleCreateMutation,
  ModuleInput,
  ModuleMutations,
  ObjectId,
  Query,
  TimestampFields,
  _ID,
} from './common';
import { CountriesModule, Country, CountryServices } from './countries';
import { CurrenciesModule } from './currencies';
import {
  DeliveryError as DeliveryErrorType,
  DeliveryModule,
  DeliveryProviderType as DeliveryProviderTypeType,
  IDeliveryAdapter,
  IDeliveryDirector,
} from './delivery';
import {
  IDeliveryPricingAdapter,
  IDeliveryPricingDirector,
} from './delivery.pricing';
import { IDiscountAdapter, IDiscountDirector } from './discount';
import {
  EnrollmentsModule,
  EnrollmentStatus as EnrollmentStatusType,
  IEnrollmentAdapter,
  IEnrollmentDirector,
} from './enrollments';
import { EventDirector, EventsModule } from './events';
import { FileDirector, FileServices, FilesModule } from './files';
import {
  FiltersModule,
  FilterType as FilterTypeType,
  IFilterAdapter,
  IFilterDirector,
} from './filters';
import { LanguagesModule } from './languages';
import {
  Logger,
  LogLevel as LogLevelType,
  LogOptions,
  Transports,
} from './logs';
import {
  OrderServices,
  OrdersModule,
  OrderStatus as OrderStatusType,
} from './orders';
import { OrderDeliveryStatus as OrderDeliveryStatusType } from './orders.deliveries';
import { OrderPaymentStatus as OrderPaymentStatusType } from './orders.payments';
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
  IPaymentPricingSheet,
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
import {
  ProductServices,
  ProductsModule,
  ProductStatus as ProductStatusType,
  ProductType,
} from './products';
import {
  IProductPricingAdapter,
  IProductPricingDirector,
  IProductPricingSheet,
  ProductPricingCalculation,
} from './products.pricing';
import {
  IQuotationAdapter,
  IQuotationDirector,
  QuotationError as QuotationErrorType,
  QuotationsModule,
  QuotationStatus as QuotationStatusType,
} from './quotations';
import { UserServices, UsersModule } from './user';
import {
  IWarehousingAdapter,
  IWarehousingDirector,
  WarehousingError as WarehousingErrorType,
  WarehousingModule,
  WarehousingProviderType as WarehousingProviderTypeType,
} from './warehousing';
import {
  IScheduler,
  IWorker,
  IWorkerAdapter,
  IWorkerDirector,
  WorkerModule,
  WorkerSchedule,
  WorkStatus as WorkerStatusType,
} from './worker';

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

  function findPreservingIds<T>(
    collection: Collection<T>
  ): (
    selector: Query,
    ids: Array<string>,
    options?: FindOptions
  ) => Promise<Array<T>>;

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
    User: SimpleSchema;
    Address: SimpleSchema;
    Contact: SimpleSchema;
  };

  // Director
  const BaseAdapter: IBaseAdapter;
  const BaseDirector: <Adapter extends IBaseAdapter>(
    directorName: string,
    options?: {
      adapterSortKey?: string;
      adapterKeyField?: string;
    }
  ) => IBaseDirector<Adapter>;
  const BasePricingAdapter: <
    AdapterContext extends BasePricingAdapterContext,
    Calculation extends PricingCalculation
  >() => IPricingAdapter<
    AdapterContext,
    Calculation,
    IPricingSheet<Calculation>
  >;
  const BasePricingDirector: <
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

  const BasePricingSheet: <Calculation extends PricingCalculation>(
    params: PricingSheetParams<Calculation>
  ) => IPricingSheet<Calculation>;
}

declare module 'meteor/unchained:logger' {
  function log(message: string, options?: LogOptions): void;
  function createLogger(
    moduleName: string,
    moreTransports?: Transports
  ): Logger;

  const LogLevel: typeof LogLevelType;
}

/*
 * Director packages
 */

declare module 'meteor/unchained:events' {
  const emit: EventDirector['emit'];
  const getEmitAdapter: EventDirector['getEmitAdapter'];
  const getEmitHistoryAdapter: EventDirector['getEmitHistoryAdapter'];
  const getRegisteredEvents: EventDirector['getRegisteredEvents'];
  const registerEvents: EventDirector['registerEvents'];
  const setEmitAdapter: EventDirector['setEmitAdapter'];
  const setEmitHistoryAdapter: EventDirector['setEmitHistoryAdapter'];
  const subscribe: EventDirector['subscribe'];
}

declare module 'meteor/unchained:director-file-upload' {
  const setFileUploadAdapter: FileDirector['setFileUploadAdapter'];
  const getFileUploadAdapter: FileDirector['getFileUploadAdapter'];

  const composeFileName: FileDirector['composeFileName'];
  const createSignedURL: FileDirector['createSignedURL'];

  const registerFileUploadCallback: FileDirector['registerFileUploadCallback'];
  const getFileUploadCallback: FileDirector['getFileUploadCallback'];

  const removeFiles: FileDirector['removeFiles'];
  const uploadFileFromStream: FileDirector['uploadFileFromStream'];
  const uploadFileFromURL: FileDirector['uploadFileFromStream'];
}

/*
 * Core packages
 */

declare module 'meteor/unchained:core-accountsjs' {
  function configureAccountsModule(
    options: AccountsOptions
  ): Promise<AccountsModule>;

  const accountsSettings: any;

  const accountsServer: any;
  const accountsPassword: any;

  function randomValueHex(len: number): string;
}

declare module 'meteor/unchained:core-assortments' {
  function configureAssortmentsModule(
    params: ModuleInput
  ): Promise<AssortmentsModule>;

  const assortmentsSettings;
}

declare module 'meteor/unchained:core-bookmarks' {
  function configureBookmarksModule(
    params: ModuleInput
  ): Promise<BookmarksModule>;

  const bookmarkServices: BookmarkServices;
}

declare module 'meteor/unchained:core-countries' {
  function configureCountriesModule(
    params: ModuleInput
  ): Promise<CountriesModule>;

  const countryServices: CountryServices;
}

declare module 'meteor/unchained:core-currencies' {
  function configureCurrenciesModule(
    params: ModuleInput
  ): Promise<CurrenciesModule>;
}

declare module 'meteor/unchained:core-delivery' {
  function configureDeliveryModule(
    params: ModuleInput
  ): Promise<DeliveryModule>;

  const deliverySettings;

  const DeliveryAdapter: IDeliveryAdapter;
  const DeliveryDirector: IDeliveryDirector;
  const DeliveryProviderType: typeof DeliveryProviderTypeType;
  const DeliveryError: typeof DeliveryErrorType;

  const DeliveryPricingAdapter: IDeliveryPricingAdapter;
  const DeliveryPricingDirector: IDeliveryPricingDirector;
}

declare module 'meteor/unchained:core-enrollments' {
  function configureEnrollmentsModule(
    params: ModuleInput
  ): Promise<EnrollmentsModule>;

  const enrollmentsSettings;

  const EnrollmentStatus: typeof EnrollmentStatusType;

  const EnrollmentAdapter: IEnrollmentAdapter;
  const EnrollmentDirector: IEnrollmentDirector;
}

declare module 'meteor/unchained:core-events' {
  function configureEventsModule(params: ModuleInput): Promise<EventsModule>;
}

declare module 'meteor/unchained:core-files-next' {
  function configureFilesModule(params: ModuleInput): Promise<FilesModule>;

  const fileServices: FileServices;
}

declare module 'meteor/unchained:core-filters' {
  function configureFiltersModule(params: ModuleInput): Promise<FiltersModule>;

  const FilterType: typeof FilterTypeType;

  const FilterAdapter: IFilterAdapter;
  const FilterDirector: IFilterDirector;
}

declare module 'meteor/unchained:core-languages' {
  function configureLanguagesModule(
    params: ModuleInput
  ): Promise<LanguagesModule>;
}

declare module 'meteor/unchained:core-orders' {
  function configureOrdersModule(params: ModuleInput): Promise<OrdersModule>;

  const orderServices: OrderServices;
  const ordersSettings;

  const OrderStatus: typeof OrderStatusType;
  const OrderDeliveryStatus: typeof OrderDeliveryStatusType;
  const OrderPaymentStatus: typeof OrderPaymentStatusType;

  const OrderDiscountAdapter: IDiscountAdapter;
  const OrderDiscountDirector: IDiscountDirector;

  const OrderPricingAdapter: IOrderPricingAdapter;
  const OrderPricingDirector: IOrderPricingDirector;
  const OrderPricingSheet: IOrderPricingSheet;
}

declare module 'meteor/unchained:core-payment' {
  function configurePaymentModule(params: ModuleInput): Promise<PaymentModule>;
  const paymentServices;

  const PaymentDirector: IPaymentDirector;
  const PaymentAdapter: IPaymentAdapter;

  const PaymentPricingAdapter: IPaymentPricingAdapter;
  const PaymentPricingDirector: IPaymentPricingDirector;
  const PaymentPricingSheet: IPaymentPricingSheet;

  const PaymentError: typeof PaymentErrorType;
  const PaymentProviderType: typeof PaymentProviderTypeType;

  const paymentLogger;
}

declare module 'meteor/unchained:core-products' {
  function configureProductsModule(
    params: ModuleInput
  ): Promise<ProductsModule>;

  const productServices: ProductServices;

  const ProductPricingAdapter: IProductPricingAdapter;
  const ProductPricingDirector: IProductPricingDirector;
  const ProductPricingSheet: (
    params: PricingSheetParams<ProductPricingCalculation>
  ) => IProductPricingSheet;

  const ProductTypes: typeof ProductType;
  const ProductStatus: typeof ProductStatusType;
}

declare module 'meteor/unchained:core-quotations' {
  function configureQuotationsModule(
    params: ModuleInput
  ): Promise<QuotationsModule>;

  const quotationsSettings;

  const QuotationStatus: typeof QuotationStatusType;

  const QuotationAdapter: IQuotationAdapter;
  const QuotationDirector: IQuotationDirector;
  const QuotationError: typeof QuotationErrorType;
}

declare module 'meteor/unchained:core-users' {
  function configureUsersModule(params: ModuleInput): Promise<UsersModule>;

  const userServices: UserServices;
}

declare module 'meteor/unchained:core-warehousing' {
  function configureWarehousingModule(
    params: ModuleInput
  ): Promise<WarehousingModule>;

  const WarehousingDirector: IWarehousingDirector;
  const WarehousingAdapter: IWarehousingAdapter;
  const WarehousingError: typeof WarehousingErrorType;
  const WarehousingProviderType: typeof WarehousingProviderTypeType;
}

declare module 'meteor/unchained:core-worker' {
  function configureWorkerModule(params: ModuleInput): Promise<WorkerModule>;

  const WorkerDirector: IWorkerDirector;
  const WorkStatus: typeof WorkerStatusType;
  const WorkerAdapter: IWorkerAdapter<any, any>;

  const EventListenerWorker: IWorker<{ workerId: string }>;
  const IntervalWorker: IWorker<{
    workerId: string;
    batchCount?: number;
    schedule: WorkerSchedule | string;
  }>;
  const FailedRescheduler: IScheduler;
}

declare module 'meteor/unchained:core' {
  function initCore(options: UnchainedCoreOptions): Context;
}

declare module 'meteor/unchained:api' {
  function startAPIServer(options: UnchainedServerOptions): {
    apolloGraphQLServer: ApolloServer;
    bulkImportServer: any;
  };
}

declare module 'meteor/unchained:mongodb' {
  function initDb(): Db;
}
