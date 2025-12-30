import {
  type AssortmentsModule,
  type AssortmentsSettingsOptions,
  configureAssortmentsModule,
  initializeAssortmentsSchema,
} from '@unchainedshop/core-assortments';
import {
  type BookmarksModule,
  configureBookmarksModule,
  initializeBookmarksSchema,
} from '@unchainedshop/core-bookmarks';
import {
  configureCountriesModule,
  type CountriesModule,
  initializeCountriesSchema,
} from '@unchainedshop/core-countries';
import {
  configureCurrenciesModule,
  type CurrenciesModule,
  initializeCurrenciesSchema,
} from '@unchainedshop/core-currencies';
import { createDrizzleDb, initializeDrizzleDb, type DrizzleDb } from '@unchainedshop/store';
import {
  configureDeliveryModule,
  type DeliveryModule,
  type DeliverySettingsOptions,
  initializeDeliverySchema,
} from '@unchainedshop/core-delivery';
import {
  configureEnrollmentsModule,
  type EnrollmentsModule,
  type EnrollmentsSettingsOptions,
  initializeEnrollmentsSchema,
} from '@unchainedshop/core-enrollments';
import {
  configureEventsModule,
  type EventsModule,
  initializeEventsSchema,
} from '@unchainedshop/core-events';
import {
  configureFilesModule,
  type FilesModule,
  type FilesSettingsOptions,
  initializeFilesSchema,
} from '@unchainedshop/core-files';
import {
  configureFiltersModule,
  type FiltersModule,
  type FiltersSettingsOptions,
  initializeFiltersSchema,
} from '@unchainedshop/core-filters';
import {
  configureLanguagesModule,
  type LanguagesModule,
  initializeLanguagesSchema,
} from '@unchainedshop/core-languages';
import {
  configureOrdersModule,
  type OrdersModule,
  type OrdersSettingsOptions,
  initializeOrdersSchema,
} from '@unchainedshop/core-orders';
import {
  configurePaymentModule,
  type PaymentModule,
  type PaymentSettingsOptions,
  initializePaymentSchema,
} from '@unchainedshop/core-payment';
import {
  configureProductsModule,
  type ProductsModule,
  type ProductsSettingsOptions,
  initializeProductsSchema,
} from '@unchainedshop/core-products';
import {
  configureQuotationsModule,
  type QuotationsModule,
  type QuotationsSettingsOptions,
  initializeQuotationsSchema,
} from '@unchainedshop/core-quotations';
import {
  configureUsersModule,
  type UserSettingsOptions,
  type UsersModule,
  initializeUsersSchema,
} from '@unchainedshop/core-users';
import {
  configureWarehousingModule,
  type WarehousingModule,
  initializeWarehousingSchema,
} from '@unchainedshop/core-warehousing';
import {
  configureWorkerModule,
  type WorkerModule,
  type WorkerSettingsOptions,
  initializeWorkQueueSchema,
} from '@unchainedshop/core-worker';
import { type MigrationRepository, type ModuleInput, type mongodb } from '@unchainedshop/mongodb';

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
  orders: OrdersModule;
  payment: PaymentModule;
  products: ProductsModule;
  quotations: QuotationsModule;
  users: UsersModule;
  warehousing: WarehousingModule;
  worker: WorkerModule;
}

export interface ModuleOptions {
  assortments?: AssortmentsSettingsOptions;
  products?: ProductsSettingsOptions;
  delivery?: DeliverySettingsOptions;
  payment?: PaymentSettingsOptions;
  filters?: FiltersSettingsOptions;
  enrollments?: EnrollmentsSettingsOptions;
  orders?: OrdersSettingsOptions;
  quotations?: QuotationsSettingsOptions;
  files?: FilesSettingsOptions;
  worker?: WorkerSettingsOptions;
  users?: UserSettingsOptions;
}

export default async function initModules(
  {
    db,
    migrationRepository,
    options,
    drizzleDb: providedDrizzleDb,
  }: {
    db: mongodb.Db;
    migrationRepository: MigrationRepository<unknown>;
    options: ModuleOptions;
    drizzleDb?: DrizzleDb;
  },
  customModules: Record<
    string,
    {
      configure: (params: ModuleInput<any>) => any;
    }
  >,
): Promise<Modules> {
  // Drizzle-based modules use a shared SQLite/Turso database
  // Use provided db, or create new connection if not provided
  let drizzleDb = providedDrizzleDb;
  if (!drizzleDb) {
    const connection = createDrizzleDb({
      url: process.env.DRIZZLE_DB_URL || 'file:unchained.db',
      authToken: process.env.DRIZZLE_DB_TOKEN,
    });
    drizzleDb = connection.db;
  }
  // Initialize all Drizzle-based module schemas (idempotent - uses IF NOT EXISTS)
  await initializeDrizzleDb(drizzleDb, [
    initializeAssortmentsSchema,
    initializeCountriesSchema,
    initializeCurrenciesSchema,
    initializeLanguagesSchema,
    initializeBookmarksSchema,
    initializeWarehousingSchema,
    initializeDeliverySchema,
    initializePaymentSchema,
    initializeQuotationsSchema,
    initializeEnrollmentsSchema,
    initializeFilesSchema,
    initializeEventsSchema,
    initializeFiltersSchema,
    initializeWorkQueueSchema,
    initializeUsersSchema,
    initializeProductsSchema,
    initializeOrdersSchema,
  ]);

  const assortments = await configureAssortmentsModule({
    db: drizzleDb,
    options: options.assortments,
  });
  const bookmarks = await configureBookmarksModule({
    db: drizzleDb,
  });
  const countries = await configureCountriesModule({
    db: drizzleDb,
  });
  const currencies = await configureCurrenciesModule({
    db: drizzleDb,
  });
  const delivery = await configureDeliveryModule({
    db: drizzleDb,
    options: options.delivery,
  });
  const enrollments = await configureEnrollmentsModule({
    db: drizzleDb,
    options: options.enrollments,
  });
  const events = await configureEventsModule({
    db: drizzleDb,
  });
  const files = await configureFilesModule({
    db: drizzleDb,
    options: options.files,
  });
  const filters = await configureFiltersModule({
    db: drizzleDb,
    options: options.filters,
  });
  const languages = await configureLanguagesModule({
    db: drizzleDb,
  });
  const orders = await configureOrdersModule({
    db: drizzleDb,
    options: options.orders,
  });
  const payment = await configurePaymentModule({
    db: drizzleDb,
    options: options.payment,
  });
  const products = await configureProductsModule({
    db: drizzleDb,
    options: options.products,
  });
  const quotations = await configureQuotationsModule({
    db: drizzleDb,
    options: options.quotations,
  });
  const users = await configureUsersModule({
    db: drizzleDb,
    options: options.users,
  });
  const warehousing = await configureWarehousingModule({
    db: drizzleDb,
  });
  const worker = await configureWorkerModule({
    db: drizzleDb,
    options: options.worker,
  });

  const modules = {
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
    orders,
    payment,
    products,
    quotations,
    users,
    warehousing,
    worker,
  };
  for (const [key, customModule] of Object.entries(customModules)) {
    modules[key] = await customModule.configure({
      db,
      options: options[key],
      migrationRepository,
    });
  }

  return modules;
}
