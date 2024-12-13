import {
  AssortmentsModule,
  AssortmentsSettingsOptions,
  configureAssortmentsModule,
} from '@unchainedshop/core-assortments';
import { BookmarksModule, configureBookmarksModule } from '@unchainedshop/core-bookmarks';
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
import { configureFilesModule, FilesModule, FilesSettingsOptions } from '@unchainedshop/core-files';
import {
  configureFiltersModule,
  FiltersModule,
  FiltersSettingsOptions,
} from '@unchainedshop/core-filters';
import { configureLanguagesModule, LanguagesModule } from '@unchainedshop/core-languages';
import { configureMessagingModule, MessagingModule } from '@unchainedshop/core-messaging';
import { configureOrdersModule, OrdersModule, OrdersSettingsOptions } from '@unchainedshop/core-orders';
import {
  configurePaymentModule,
  PaymentModule,
  PaymentSettingsOptions,
} from '@unchainedshop/core-payment';
import {
  configureProductsModule,
  ProductsModule,
  ProductsSettingsOptions,
} from '@unchainedshop/core-products';
import {
  configureQuotationsModule,
  QuotationsModule,
  QuotationsSettingsOptions,
} from '@unchainedshop/core-quotations';
import { configureUsersModule, UserSettingsOptions, UsersModule } from '@unchainedshop/core-users';
import { configureWarehousingModule, WarehousingModule } from '@unchainedshop/core-warehousing';
import { configureWorkerModule, WorkerModule, WorkerSettingsOptions } from '@unchainedshop/core-worker';
import { MigrationRepository, mongodb } from '@unchainedshop/mongodb';

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

const initModules = async ({
  db,
  migrationRepository,
  options,
}: {
  db: mongodb.Db;
  migrationRepository: MigrationRepository<unknown>;
  options?: ModuleOptions;
}): Promise<Modules> => {
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

  return {
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
  };
};

export default initModules;
