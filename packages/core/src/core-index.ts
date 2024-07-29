import { BulkImporter, Migration, MigrationRepository, ModuleInput } from './types.js';
import {
  AssortmentsModule,
  AssortmentsSettingsOptions,
  configureAssortmentsModule,
} from '@unchainedshop/core-assortments';
import {
  BookmarkServices,
  bookmarkServices,
  BookmarksModule,
  configureBookmarksModule,
} from '@unchainedshop/core-bookmarks';
import { configureCountriesModule, CountriesModule } from '@unchainedshop/core-countries';
import { configureCurrenciesModule, CurrenciesModule } from '@unchainedshop/core-currencies';
import {
  configureDeliveryModule,
  DeliveryModule,
  DeliverySettingsOptions,
} from '@unchainedshop/core-delivery';
import {
  configureEnrollmentsModule,
  EnrollmentsModule,
  EnrollmentsSettingsOptions,
} from '@unchainedshop/core-enrollments';
import { configureEventsModule, EventsModule } from '@unchainedshop/core-events';
import {
  configureFilesModule,
  FileServices,
  fileServices,
  FilesModule,
  FilesSettingsOptions,
} from '@unchainedshop/core-files';
import {
  configureFiltersModule,
  FiltersModule,
  FiltersSettingsOptions,
} from '@unchainedshop/core-filters';
import { configureLanguagesModule, LanguagesModule } from '@unchainedshop/core-languages';
import { configureMessagingModule, MessagingModule } from '@unchainedshop/core-messaging';
import {
  configureOrdersModule,
  OrderServices,
  orderServices,
  OrdersModule,
  OrdersSettingsOptions,
} from '@unchainedshop/core-orders';
import {
  configurePaymentModule,
  PaymentModule,
  PaymentSettingsOptions,
} from '@unchainedshop/core-payment';
import {
  configureProductsModule,
  ProductServices,
  productServices,
  ProductsModule,
  ProductsSettingsOptions,
} from '@unchainedshop/core-products';
import {
  configureQuotationsModule,
  QuotationsModule,
  QuotationsSettingsOptions,
} from '@unchainedshop/core-quotations';
import {
  configureUsersModule,
  UserServices,
  userServices,
  UserSettingsOptions,
  UsersModule,
} from '@unchainedshop/core-users';
import { configureWarehousingModule, WarehousingModule } from '@unchainedshop/core-warehousing';
import { configureWorkerModule, WorkerModule, WorkerSettingsOptions } from '@unchainedshop/core-worker';
import { mongodb } from '@unchainedshop/mongodb';

export * from './types.js';

export interface ModuleOptions {
  assortments?: AssortmentsSettingsOptions;
  products?: ProductsSettingsOptions;
  delivery?: DeliverySettingsOptions;
  filters?: FiltersSettingsOptions;
  enrollments?: EnrollmentsSettingsOptions;
  orders?: OrdersSettingsOptions;
  quotations?: QuotationsSettingsOptions;
  files?: FilesSettingsOptions;
  payment?: PaymentSettingsOptions;
  worker?: WorkerSettingsOptions;
  users?: UserSettingsOptions;
}

export interface UnchainedCoreOptions {
  db: mongodb.Db;
  migrationRepository: MigrationRepository<Migration>;
  bulkImporter: any;
  modules: Record<
    string,
    {
      configure: (params: ModuleInput<any>) => any;
    }
  >;
  services: Record<string, any>;
  options: ModuleOptions;
}

export interface Modules {
  assortments: AssortmentsModule;
  bookmarks: BookmarksModule;
  countries: CountriesModule;
  currencies: CurrenciesModule;
  delivery: DeliveryModule;
  enrollments: EnrollmentsModule;
  events: EventsModule;
  files: FilesModule;
  filters: FiltersModule;
  languages: LanguagesModule;
  messaging: MessagingModule;
  orders: OrdersModule;
  payment: PaymentModule;
  products: ProductsModule;
  quotations: QuotationsModule;
  users: UsersModule;
  warehousing: WarehousingModule;
  worker: WorkerModule;
}

export interface Services {
  bookmarks: BookmarkServices;
  files: FileServices;
  orders: OrderServices;
  products: ProductServices;
  users: UserServices;
}

export interface UnchainedCore {
  modules: Modules;
  services: Services;
  bulkImporter: BulkImporter;
  options: ModuleOptions;
}

export const initCore = async ({
  db,
  migrationRepository,
  bulkImporter,
  modules = {},
  services = {},
  options = {},
}: UnchainedCoreOptions): Promise<UnchainedCore> => {
  const assortments = await configureAssortmentsModule({
    db,
    options: options.assortments,
    migrationRepository,
  });
  const bookmarks = await configureBookmarksModule({
    db,
    migrationRepository,
  });
  const countries = await configureCountriesModule({
    db,
    migrationRepository,
  });
  const currencies = await configureCurrenciesModule({
    db,
    migrationRepository,
  });
  const delivery = await configureDeliveryModule({
    db,
    options: options.delivery,
    migrationRepository,
  });
  const enrollments = await configureEnrollmentsModule({
    db,
    options: options.enrollments,
    migrationRepository,
  });
  const events = await configureEventsModule({
    db,
    migrationRepository,
  });
  const files = await configureFilesModule({
    db,
    options: options.files,
    migrationRepository,
  });
  const filters = await configureFiltersModule({
    db,
    options: options.filters,
    migrationRepository,
  });
  const languages = await configureLanguagesModule({
    db,
    migrationRepository,
  });
  const messaging = await configureMessagingModule({
    db,
    migrationRepository,
  });
  const orders = await configureOrdersModule({
    db,
    options: options.orders,
    migrationRepository,
  });
  const payment = await configurePaymentModule({
    db,
    options: options.payment,
    migrationRepository,
  });
  const products = await configureProductsModule({
    db,
    migrationRepository,
  });
  const quotations = await configureQuotationsModule({
    db,
    options: options.quotations,
    migrationRepository,
  });
  const users = await configureUsersModule({
    db,
    migrationRepository,
  });
  const warehousing = await configureWarehousingModule({
    db,
    migrationRepository,
  });
  const worker = await configureWorkerModule({
    db,
    options: options.worker,
    migrationRepository,
  });

  // Configure custom modules
  const customModules = await Object.entries(modules).reduce(
    async (modulesPromise, [key, customModule]: any) => {
      return {
        ...(await modulesPromise),
        [key]: await customModule.configure({
          db,
          options: options?.[key],
          migrationRepository,
        }),
      };
    },
    Promise.resolve({}),
  );

  return {
    modules: {
      assortments,
      bookmarks,
      countries,
      currencies,
      delivery,
      enrollments,
      events,
      files,
      filters,
      languages,
      messaging,
      orders,
      payment,
      products,
      quotations,
      users,
      warehousing,
      worker,
      ...customModules,
    },
    services: {
      bookmarks: bookmarkServices,
      files: fileServices,
      orders: orderServices,
      products: productServices,
      users: userServices,
      ...services,
    },
    bulkImporter,
    options,
  };
};
