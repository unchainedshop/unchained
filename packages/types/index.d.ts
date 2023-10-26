import { IncomingMessage } from 'http';
import SimpleSchema from 'simpl-schema';
import { Context } from './api.js';
import { AssortmentsModule, AssortmentsSettings, AssortmentsSettingsOptions } from './assortments.js';

import { BookmarkServices, BookmarksModule } from './bookmarks.js';
import { Db, IBaseAdapter, IBaseDirector, Locale, Locales, TimestampFields } from './common.js';

import { CountriesModule, Country, CountryServices } from './countries.js';
import { CurrenciesModule } from './currencies.js';
import {
  DeliveryError as DeliveryErrorType,
  DeliveryModule,
  DeliveryProviderType as DeliveryProviderTypeType,
  DeliverySettingsOptions,
  DeliverySettings,
  IDeliveryAdapter,
  IDeliveryDirector,
} from './delivery.js';
import {
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter,
  IDeliveryPricingDirector,
  IDeliveryPricingSheet,
} from './delivery.pricing.js';
import { IDiscountAdapter, IDiscountDirector } from './discount.js';
import {
  EnrollmentsModule,
  EnrollmentsSettingsOptions,
  EnrollmentStatus as EnrollmentStatusType,
  IEnrollmentAdapter,
  IEnrollmentDirector,
} from './enrollments.js';
import { EventDirector, EventsModule } from './events.js';
import {
  FileServices,
  FilesSettings,
  FilesSettingsOptions,
  FilesModule,
  IFileAdapter,
  IFileDirector,
} from './files.js';
import {
  FiltersModule,
  FilterType as FilterTypeType,
  IFilterAdapter,
  IFilterDirector,
  FiltersSettings,
  FiltersSettingsOptions,
} from './filters.js';
import { LanguagesModule } from './languages.js';
import { IMessagingDirector, MessagingModule } from './messaging.js';
import {
  OrderServices,
  OrdersModule,
  OrdersSettingsOptions,
  OrderStatus as OrderStatusType,
} from './orders.js';
import { OrderDeliveryStatus as OrderDeliveryStatusType } from './orders.deliveries.js';
import { OrderPaymentStatus as OrderPaymentStatusType } from './orders.payments.js';
import {
  IOrderPricingAdapter,
  IOrderPricingDirector,
  IOrderPricingSheet,
  OrderPricingCalculation,
} from './orders.pricing.js';
import {
  IPaymentAdapter,
  IPaymentDirector,
  PaymentError as PaymentErrorType,
  PaymentModule,
  PaymentSettingsOptions,
  PaymentSettings,
  PaymentProviderType as PaymentProviderTypeType,
} from './payments.js';
import {
  IPaymentPricingAdapter,
  IPaymentPricingDirector,
  IPaymentPricingSheet,
  PaymentPricingCalculation,
} from './payments.pricing.js';
import {
  BasePricingAdapterContext,
  BasePricingContext,
  IPricingDirector,
  IPricingAdapter,
  IPricingSheet,
  PricingCalculation,
  PricingSheetParams,
  IBasePricingSheet,
} from './pricing.js';
import {
  ProductServices,
  ProductsModule,
  ProductStatus as ProductStatusType,
  ProductType,
  ProductsSettings,
} from './products.js';
import {
  IProductPricingAdapter,
  IProductPricingDirector,
  IProductPricingSheet,
  ProductPricingCalculation,
} from './products.pricing.js';
import {
  IQuotationAdapter,
  IQuotationDirector,
  QuotationError as QuotationErrorType,
  QuotationsModule,
  QuotationsSettingsOptions,
  QuotationStatus as QuotationStatusType,
} from './quotations.js';
import {
  IWarehousingAdapter,
  IWarehousingDirector,
  WarehousingError as WarehousingErrorType,
  WarehousingModule,
  WarehousingProviderType as WarehousingProviderTypeType,
} from './warehousing.js';
import {
  IScheduler,
  IWorker,
  IWorkerAdapter,
  IWorkerDirector,
  WorkerModule,
  WorkerSchedule,
  WorkStatus as WorkerStatusType,
} from './worker.js';
import { UnchainedCoreOptions, ModuleInput } from './core.js';

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

  const messagingLogger: any;
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
  const acl: any;
  const errors: any;
  const roles: APIRoles;
}

declare module '@unchainedshop/mongodb' {
  function initDb(): Promise<Db>;
}
