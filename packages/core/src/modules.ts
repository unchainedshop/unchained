import {
  type AssortmentsModule,
  type AssortmentsSettingsOptions,
  configureAssortmentsModule,
} from '@unchainedshop/core-assortments';
import { type BookmarksModule, configureBookmarksModule } from '@unchainedshop/core-bookmarks';
import {
  configureCountriesModule,
  type CountriesModule,
  countriesSchema,
} from '@unchainedshop/core-countries';
import { configureCurrenciesModule, type CurrenciesModule } from '@unchainedshop/core-currencies';
import { createTursoStore } from '@unchainedshop/store';
import {
  configureDeliveryModule,
  type DeliveryModule,
  type DeliverySettingsOptions,
} from '@unchainedshop/core-delivery';
import {
  configureEnrollmentsModule,
  type EnrollmentsModule,
  type EnrollmentsSettingsOptions,
} from '@unchainedshop/core-enrollments';
import { configureEventsModule, type EventsModule } from '@unchainedshop/core-events';
import {
  configureFilesModule,
  type FilesModule,
  type FilesSettingsOptions,
} from '@unchainedshop/core-files';
import {
  configureFiltersModule,
  type FiltersModule,
  type FiltersSettingsOptions,
} from '@unchainedshop/core-filters';
import { configureLanguagesModule, type LanguagesModule } from '@unchainedshop/core-languages';
import {
  configureOrdersModule,
  type OrdersModule,
  type OrdersSettingsOptions,
} from '@unchainedshop/core-orders';
import {
  configurePaymentModule,
  type PaymentModule,
  type PaymentSettingsOptions,
} from '@unchainedshop/core-payment';
import {
  configureProductsModule,
  type ProductsModule,
  type ProductsSettingsOptions,
} from '@unchainedshop/core-products';
import {
  configureQuotationsModule,
  type QuotationsModule,
  type QuotationsSettingsOptions,
} from '@unchainedshop/core-quotations';
import {
  configureUsersModule,
  type UserSettingsOptions,
  type UsersModule,
} from '@unchainedshop/core-users';
import { configureWarehousingModule, type WarehousingModule } from '@unchainedshop/core-warehousing';
import {
  configureWorkerModule,
  type WorkerModule,
  type WorkerSettingsOptions,
} from '@unchainedshop/core-worker';
import { type MigrationRepository, type ModuleInput, type mongodb } from '@unchainedshop/mongodb';
import type { IStore } from '@unchainedshop/store';

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
    store: providedStore,
  }: {
    db: mongodb.Db;
    migrationRepository: MigrationRepository<unknown>;
    options: ModuleOptions;
    store?: IStore;
  },
  customModules: Record<
    string,
    {
      configure: (params: ModuleInput<any>) => any;
    }
  >,
): Promise<Modules> {
  const assortments = await configureAssortmentsModule({
    db,
    options: options.assortments,
    migrationRepository,
  });
  const bookmarks = await configureBookmarksModule({
    db,
    migrationRepository,
  });
  // Countries module uses the new IStore interface
  // Use provided store, or create Turso/SQLite store if not provided
  const store =
    providedStore ||
    (await createTursoStore({
      url: process.env.COUNTRIES_DB_URL || 'file:countries.db',
      authToken: process.env.COUNTRIES_DB_TOKEN,
      environment: 'server',
      schemas: {
        countries: countriesSchema,
      },
    }));
  if (!providedStore) {
    await store.initialize();
  }
  const countries = await configureCountriesModule({
    store,
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
    options: options.products,
  });
  const quotations = await configureQuotationsModule({
    db,
    options: options.quotations,
    migrationRepository,
  });
  const users = await configureUsersModule({
    db,
    options: options.users,
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
