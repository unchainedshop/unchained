import { IncomingMessage, OutgoingMessage } from 'http';
import SimpleSchema from 'simpl-schema';
import { AccountsModule, AccountsSettings, AccountsSettingsOptions } from './accounts';
import { Context } from './api';
import { AssortmentsModule, AssortmentsSettings, AssortmentsSettingsOptions } from './assortments';
import { MessageTypes as MessageTypesType, PlatformOptions } from './platform';

import { BookmarkServices, BookmarksModule } from './bookmarks';
import {
  Db,
  IBaseAdapter,
  IBaseDirector,
  Locale,
  Locales,
  ModuleInput,
  TimestampFields,
} from './common';
import { CountriesModule, Country, CountryServices } from './countries';
import { CurrenciesModule } from './currencies';
import {
  DeliveryError as DeliveryErrorType,
  DeliveryModule,
  DeliveryProviderType as DeliveryProviderTypeType,
  DeliverySettingsOptions,
  DeliverySettings,
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
import {
  FileServices,
  FilesSettings,
  FilesSettingsOptions,
  FilesModule,
  IFileAdapter,
  IFileDirector,
} from './files';
import {
  FiltersModule,
  FilterType as FilterTypeType,
  IFilterAdapter,
  IFilterDirector,
  FiltersSettings,
  FiltersSettingsOptions,
} from './filters';
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
  PaymentSettingsOptions,
  PaymentSettings,
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
  IPricingDirector,
  IPricingAdapter,
  IPricingSheet,
  PricingCalculation,
  PricingSheetParams,
  IBasePricingSheet,
} from './pricing';
import {
  ProductServices,
  ProductsModule,
  ProductStatus as ProductStatusType,
  ProductType,
  ProductsSettings,
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
import { RolesInterface, RoleInterfaceFactory } from './roles';
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
import { UnchainedCore, UnchainedCoreOptions } from './core';

declare module '@unchainedshop/utils' {
  function resolveBestSupported(language: string, locales: Locales): Locale;
  function resolveBestCountry(
    contextCountry: string,
    headerCountry: string | string[],
    countries: Array<Country>,
  ): string;
  function resolveUserRemoteAddress(req: IncomingMessage): {
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
  ) => IPricingDirector<
    PricingContext,
    Calculation,
    AdapterPricingContext,
    IPricingSheet<Calculation>,
    Adapter
  >;

  const BasePricingSheet: <Calculation extends PricingCalculation>(
    params: PricingSheetParams<Calculation>,
  ) => IBasePricingSheet<Calculation>;
}

declare module '@unchainedshop/logger' {
  function log(message: string, options?: LogOptions): void;
  function createLogger(moduleName: string, moreTransports?: Transports): Logger;

  const LogLevel: typeof LogLevelType;
}

/*
 * Director packages
 */

declare module '@unchainedshop/events' {
  const emit: EventDirector['emit'];
  const getEmitAdapter: EventDirector['getEmitAdapter'];
  const getEmitHistoryAdapter: EventDirector['getEmitHistoryAdapter'];
  const getRegisteredEvents: EventDirector['getRegisteredEvents'];
  const registerEvents: EventDirector['registerEvents'];
  const setEmitAdapter: EventDirector['setEmitAdapter'];
  const setEmitHistoryAdapter: EventDirector['setEmitHistoryAdapter'];
  const subscribe: EventDirector['subscribe'];
}

declare module '@unchainedshop/file-upload' {
  const FileAdapter: Omit<IFileAdapter, 'key' | 'lable' | 'version'>;
  const FileDirector: IFileDirector;
}

/*
 * Core packages
 */

declare module '@unchainedshop/core-accountsjs' {
  function configureAccountsModule(
    params: ModuleInput<AccountsSettingsOptions>,
  ): Promise<AccountsModule>;

  const accountsSettings: AccountsSettings;
}

declare module '@unchainedshop/core-assortments' {
  function configureAssortmentsModule(
    params: ModuleInput<AssortmentsSettingsOptions>,
  ): Promise<AssortmentsModule>;

  const assortmentsSettings: AssortmentsSettings;
}

declare module '@unchainedshop/core-bookmarks' {
  function configureBookmarksModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<BookmarksModule>;

  const bookmarkServices: BookmarkServices;
}

declare module '@unchainedshop/core-countries' {
  function configureCountriesModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<CountriesModule>;

  const countryServices: CountryServices;
}

declare module '@unchainedshop/core-currencies' {
  function configureCurrenciesModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<CurrenciesModule>;
}

declare module '@unchainedshop/core-delivery' {
  function configureDeliveryModule(
    params: ModuleInput<DeliverySettingsOptions>,
  ): Promise<DeliveryModule>;

  const deliverySettings: DeliverySettings;

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

declare module '@unchainedshop/core-enrollments' {
  function configureEnrollmentsModule(
    params: ModuleInput<EnrollmentsSettingsOptions>,
  ): Promise<EnrollmentsModule>;

  const enrollmentsSettings;

  const EnrollmentStatus: typeof EnrollmentStatusType;

  const EnrollmentAdapter: IEnrollmentAdapter;
  const EnrollmentDirector: IEnrollmentDirector;
}

declare module '@unchainedshop/plugins/worker/GenerateOrderWorker' {
  function configureGenerateOrderAutoscheduling(): void;
}

declare module '@unchainedshop/core-events' {
  function configureEventsModule(params: ModuleInput<Record<string, never>>): Promise<EventsModule>;
}

declare module '@unchainedshop/core-files' {
  function configureFilesModule(params: ModuleInput<FilesSettingsOptions>): Promise<FilesModule>;

  const fileServices: FileServices;
  const filesSettings: FilesSettings;
}

declare module '@unchainedshop/core-filters' {
  function configureFiltersModule(params: ModuleInput<FiltersSettingsOptions>): Promise<FiltersModule>;

  const filtersSettings: FiltersSettings;

  const FilterType: typeof FilterTypeType;
  const FilterAdapter: IFilterAdapter;
  const FilterDirector: IFilterDirector;
}

declare module '@unchainedshop/core-languages' {
  function configureLanguagesModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<LanguagesModule>;
}

declare module '@unchainedshop/core-messaging' {
  function configureMessagingModule(params: ModuleInput<Record<string, never>>): MessagingModule;

  const MessagingDirector: IMessagingDirector;

  const messagingLogger: Logger;
}

declare module '@unchainedshop/core-orders' {
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

declare module '@unchainedshop/core-payment' {
  function configurePaymentModule(params: ModuleInput<PaymentSettingsOptions>): Promise<PaymentModule>;

  const paymentSettings: PaymentSettings;
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
}

declare module '@unchainedshop/core-products' {
  function configureProductsModule(params: ModuleInput<Record<string, never>>): Promise<ProductsModule>;

  const productServices: ProductServices;
  const productsSettings: ProductsSettings;

  const ProductPricingAdapter: IProductPricingAdapter;
  const ProductPricingDirector: IProductPricingDirector;
  const ProductPricingSheet: (
    params: PricingSheetParams<ProductPricingCalculation>,
  ) => IProductPricingSheet;

  const ProductTypes: typeof ProductType;
  const ProductStatus: typeof ProductStatusType;
}

declare module '@unchainedshop/core-quotations' {
  function configureQuotationsModule(
    params: ModuleInput<QuotationsSettingsOptions>,
  ): Promise<QuotationsModule>;

  const quotationsSettings;

  const QuotationStatus: typeof QuotationStatusType;

  const QuotationAdapter: IQuotationAdapter;
  const QuotationDirector: IQuotationDirector;
  const QuotationError: typeof QuotationErrorType;
}

declare module '@unchainedshop/core-users' {
  function configureUsersModule(params: ModuleInput<Record<string, never>>): Promise<UsersModule>;

  const userServices: UserServices;
}

declare module '@unchainedshop/core-warehousing' {
  function configureWarehousingModule(
    params: ModuleInput<Record<string, never>>,
  ): Promise<WarehousingModule>;

  const WarehousingDirector: IWarehousingDirector;
  const WarehousingAdapter: IWarehousingAdapter;
  const WarehousingError: typeof WarehousingErrorType;
  const WarehousingProviderType: typeof WarehousingProviderTypeType;
}

declare module '@unchainedshop/core-worker' {
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

declare module '@unchainedshop/core' {
  function initCore(options: UnchainedCoreOptions): Promise<Context>;
}

type APIRoles = {
  allRoles: any;
  actions: any;
  configureRoles(params: any): any;
  updateUserRole(context: Context, roleName: string): any;
};

declare module '@unchainedshop/api' {
  function hashPassword(password: string): string;

  function useMiddlewareWithCurrentContext(
    expressApp: any,
    path: string,
    fn: (
      req: IncomingMessage & { unchainedContext: UnchainedCore },
      res: OutgoingMessage,
    ) => Promise<any>,
  ): void;

  const acl: any;
  const errors: any;
  const roles: APIRoles;
}

declare module '@unchainedshop/mongodb' {
  function initDb(): Promise<Db>;
}

declare module '@unchainedshop/roles' {
  const Roles: RolesInterface;
  const Role: RoleInterfaceFactory;

  function isFunction(func: () => any): boolean;
  function has(obj: { [key: string]: any }, key: string): boolean;
}
declare module '@unchainedshop/platform' {
  const MessageTypes: typeof MessageTypesType;
  const queueWorkers: Array<any>;

  function startPlatform(options: PlatformOptions): Promise<Context>;
  function withAccessToken(fn?: (context: Context) => any): any;
  function setAccessToken(unchainedAPI: Context, username: string, secret: string): Promise<void>;
}
