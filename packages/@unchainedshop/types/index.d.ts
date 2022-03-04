import { ApolloServer } from 'apollo-server-express';
import { Request } from 'express';
import SimpleSchema from 'simpl-schema';
import { AccountsModule, AccountsSettings, AccountsSettingsOptions } from './accounts';
import { Context, UnchainedCoreOptions, UnchainedServerOptions } from './api';
import { AssortmentsModule, AssortmentsSettingsOptions } from './assortments';
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
  Locale,
  Locales,
  ModuleCreateMutation,
  ModuleInput,
  ModuleMutations,
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
  DeliverySettingsOptions,
  IDeliveryAdapter,
  IDeliveryDirector,
} from './delivery';
import {
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter,
  IDeliveryPricingDirector,
  IDeliveryPricingSheet,
} from './delivery.pricing';
import { IDiscountAdapter, IDiscountDirector } from './discount';
import {
  EnrollmentsModule,
  EnrollmentsSettingsOptions,
  EnrollmentStatus as EnrollmentStatusType,
  IEnrollmentAdapter,
  IEnrollmentDirector,
} from './enrollments';
import { EventDirector, EventsModule } from './events';
import { FileServices, FilesModule, IFileAdapter, IFileDirector } from './files';
import { FiltersModule, FilterType as FilterTypeType, IFilterAdapter, IFilterDirector } from './filters';
import { LanguagesModule } from './languages';
import { Logger, LogLevel as LogLevelType, LogOptions, Transports } from './logs';
import { IMessagingDirector, MessagingModule } from './messaging';
import {
  OrderServices,
  OrdersModule,
  OrdersSettingsOptions,
  OrderStatus as OrderStatusType,
} from './orders';
import { OrderDeliveryStatus as OrderDeliveryStatusType } from './orders.deliveries';
import { OrderPaymentStatus as OrderPaymentStatusType } from './orders.payments';
import {
  IOrderPricingAdapter,
  IOrderPricingDirector,
  IOrderPricingSheet,
  OrderPricingCalculation,
} from './orders.pricing';
import {
  IPaymentAdapter,
  IPaymentDirector,
  PaymentError as PaymentErrorType,
  PaymentModule,
  PaymentProvidersSettingsOptions,
  PaymentProviderType as PaymentProviderTypeType,
} from './payments';
import {
  IPaymentPricingAdapter,
  IPaymentPricingDirector,
  IPaymentPricingSheet,
  PaymentPricingCalculation,
} from './payments.pricing';
import {
  BasePricingAdapterContext,
  BasePricingContext,
  IBasePricingDirector,
  IPricingAdapter,
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
  QuotationsSettingsOptions,
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
      | undefined,
  ): void;

  function findUnusedSlug(
    checkSlugIsUniqueFn: (slug: string) => Promise<boolean>,
    options: { slugify?: (text: string) => string },
  ): (params: { title?: string; existingSlug: string; newSlug?: string }) => Promise<string>;

  function findLocalizedText<T>(
    collection: Collection<T>,
    selector: Query,
    locale: string | Locale,
  ): Promise<T>;

  function findPreservingIds<T>(
    collection: Collection<T>,
  ): (selector: Query, ids: Array<string>, options?: FindOptions) => Promise<Array<T>>;

  function generateDbObjectId(): string;
  function generateDbFilterById<T extends { _id?: _ID }>(id: any, query?: Filter<T>): Filter<T>;

  function generateDbMutations<T extends { _id?: _ID }>(
    collection: Collection<T>,
    schema: SimpleSchema,
    options?: { hasCreateOnly: boolean },
  ): ModuleMutations<T> | ModuleCreateMutation<T>;

  function buildDbIndexes<T extends Document>(
    collection: Collection<T>,
    indexes: Indexes<T>,
  ): Promise<boolean>;

  function resolveBestSupported(language: string, locales: Locales): Locale;
  function resolveBestCountry(
    contextCountry: string,
    headerCountry: string | string[],
    countries: Array<Country>,
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
    },
  ) => IBaseDirector<Adapter>;

  const BaseDiscountAdapter: Omit<IDiscountAdapter, 'key' | 'label' | 'version'>;
  const BaseDiscountDirector: (directorName: string) => IDiscountDirector;

  const BasePricingAdapter: <
    AdapterContext extends BasePricingAdapterContext,
    Calculation extends PricingCalculation,
  >() => IPricingAdapter<AdapterContext, Calculation, IPricingSheet<Calculation>>;

  const BasePricingDirector: <
    PricingContext extends BasePricingContext,
    AdapterPricingContext extends BasePricingAdapterContext,
    Calculation extends PricingCalculation,
    Adapter extends IPricingAdapter<AdapterPricingContext, Calculation, IPricingSheet<Calculation>>,
  >(
    directorName: string,
  ) => IBasePricingDirector<PricingContext, AdapterPricingContext, Calculation, Adapter>;

  const BasePricingSheet: <Calculation extends PricingCalculation>(
    params: PricingSheetParams<Calculation>,
  ) => IPricingSheet<Calculation>;
}

declare module 'meteor/unchained:logger' {
  function log(message: string, options?: LogOptions): void;
  function createLogger(moduleName: string, moreTransports?: Transports): Logger;

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

declare module 'meteor/unchained:file-upload' {
  const FileAdapter: Omit<IFileAdapter, 'key' | 'lable' | 'version'>;
  const FileDirector: IFileDirector;
}

/*
 * Core packages
 */

declare module 'meteor/unchained:core-accountsjs' {
  function configureAccountsModule(
    params: ModuleInput<AccountsSettingsOptions>,
  ): Promise<AccountsModule>;

  function configureAccountServer(context: Context): any;

  const accountsSettings: AccountsSettings;

  function randomValueHex(len: number): string;
}

declare module 'meteor/unchained:core-assortments' {
  function configureAssortmentsModule(
    params: ModuleInput<AssortmentsSettingsOptions>,
  ): Promise<AssortmentsModule>;

  const assortmentsSettings;
}

declare module 'meteor/unchained:core-bookmarks' {
  function configureBookmarksModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<BookmarksModule>;

  const bookmarkServices: BookmarkServices;
}

declare module 'meteor/unchained:core-countries' {
  function configureCountriesModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<CountriesModule>;

  const countryServices: CountryServices;
}

declare module 'meteor/unchained:core-currencies' {
  function configureCurrenciesModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<CurrenciesModule>;
}

declare module 'meteor/unchained:core-delivery' {
  function configureDeliveryModule(
    params: ModuleInput<DeliverySettingsOptions>,
  ): Promise<DeliveryModule>;

  const deliverySettings;

  const DeliveryAdapter: IDeliveryAdapter;
  const DeliveryDirector: IDeliveryDirector;
  const DeliveryProviderType: typeof DeliveryProviderTypeType;
  const DeliveryError: typeof DeliveryErrorType;

  const DeliveryPricingAdapter: IDeliveryPricingAdapter;
  const DeliveryPricingDirector: IDeliveryPricingDirector;
  const DeliveryPricingSheet: (
    params: PricingSheetParams<DeliveryPricingCalculation>,
  ) => IDeliveryPricingSheet;
}

declare module 'meteor/unchained:core-enrollments' {
  function configureEnrollmentsModule(
    params: ModuleInput<EnrollmentsSettingsOptions>,
  ): Promise<EnrollmentsModule>;

  const enrollmentsSettings;

  const EnrollmentStatus: typeof EnrollmentStatusType;

  const EnrollmentAdapter: IEnrollmentAdapter;
  const EnrollmentDirector: IEnrollmentDirector;
}

declare module 'meteor/unchained:core-enrollments/workers/GenerateOrderWorker' {
  function configureGenerateOrderAutoscheduling(): void;
}

declare module 'meteor/unchained:core-events' {
  function configureEventsModule(params: ModuleInput<Record<string, never>>): Promise<EventsModule>;
}

declare module 'meteor/unchained:core-files-next' {
  function configureFilesModule(params: ModuleInput<Record<string, never>>): Promise<FilesModule>;

  const fileServices: FileServices;
}

declare module 'meteor/unchained:core-filters' {
  function configureFiltersModule(params: ModuleInput<Record<string, never>>): Promise<FiltersModule>;

  const FilterType: typeof FilterTypeType;

  const FilterAdapter: IFilterAdapter;
  const FilterDirector: IFilterDirector;
}

declare module 'meteor/unchained:core-languages' {
  function configureLanguagesModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<LanguagesModule>;
}

declare module 'meteor/unchained:core-messaging' {
  function configureMessagingModule(params: ModuleInput<Record<string, never>>): MessagingModule;

  const MessagingDirector: IMessagingDirector;

  const messagingLogger: Logger;
}

declare module 'meteor/unchained:core-orders' {
  function configureOrdersModule(params: ModuleInput<OrdersSettingsOptions>): Promise<OrdersModule>;

  const orderServices: OrderServices;
  const ordersSettings;

  const OrderStatus: typeof OrderStatusType;
  const OrderDeliveryStatus: typeof OrderDeliveryStatusType;
  const OrderPaymentStatus: typeof OrderPaymentStatusType;

  const OrderDiscountAdapter: IDiscountAdapter;
  const OrderDiscountDirector: IDiscountDirector;

  const OrderPricingAdapter: IOrderPricingAdapter;
  const OrderPricingDirector: IOrderPricingDirector;
  const OrderPricingSheet: (params: PricingSheetParams<OrderPricingCalculation>) => IOrderPricingSheet;
}

declare module 'meteor/unchained:core-payment' {
  function configurePaymentModule(
    params: ModuleInput<PaymentProvidersSettingsOptions>,
  ): Promise<PaymentModule>;
  const paymentServices;

  const PaymentDirector: IPaymentDirector;
  const PaymentAdapter: IPaymentAdapter;

  const PaymentPricingAdapter: IPaymentPricingAdapter;
  const PaymentPricingDirector: IPaymentPricingDirector;
  const PaymentPricingSheet: (
    params: PricingSheetParams<PaymentPricingCalculation>,
  ) => IPaymentPricingSheet;

  const PaymentError: typeof PaymentErrorType;
  const PaymentProviderType: typeof PaymentProviderTypeType;

  const paymentLogger: Logger;
}

declare module 'meteor/unchained:core-products' {
  function configureProductsModule(params: ModuleInput<Record<string, never>>): Promise<ProductsModule>;

  const productServices: ProductServices;

  const ProductPricingAdapter: IProductPricingAdapter;
  const ProductPricingDirector: IProductPricingDirector;
  const ProductPricingSheet: (
    params: PricingSheetParams<ProductPricingCalculation>,
  ) => IProductPricingSheet;

  const ProductTypes: typeof ProductType;
  const ProductStatus: typeof ProductStatusType;
}

declare module 'meteor/unchained:core-quotations' {
  function configureQuotationsModule(
    params: ModuleInput<QuotationsSettingsOptions>,
  ): Promise<QuotationsModule>;

  const quotationsSettings;

  const QuotationStatus: typeof QuotationStatusType;

  const QuotationAdapter: IQuotationAdapter;
  const QuotationDirector: IQuotationDirector;
  const QuotationError: typeof QuotationErrorType;
}

declare module 'meteor/unchained:core-users' {
  function configureUsersModule(params: ModuleInput<Record<string, never>>): Promise<UsersModule>;

  const userServices: UserServices;
}

declare module 'meteor/unchained:core-warehousing' {
  function configureWarehousingModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<WarehousingModule>;

  const WarehousingDirector: IWarehousingDirector;
  const WarehousingAdapter: IWarehousingAdapter;
  const WarehousingError: typeof WarehousingErrorType;
  const WarehousingProviderType: typeof WarehousingProviderTypeType;
}

declare module 'meteor/unchained:core-worker' {
  function configureWorkerModule(params: ModuleInput<Record<string, never>>): Promise<WorkerModule>;

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
  function initCore(options: UnchainedCoreOptions): Promise<Context>;
}

declare module 'meteor/unchained:api' {
  function startAPIServer(options: UnchainedServerOptions): {
    apolloGraphQLServer: ApolloServer;
    bulkImportServer: any;
  };

  function hashPassword(password: string): string;
}

declare module 'meteor/unchained:mongodb' {
  function initDb(): Promise<Db>;
}
