import { UnchainedCore, UnchainedCoreOptions } from '@unchainedshop/types/core.js';
import { configureAccountsModule } from '@unchainedshop/core-accountsjs';
import { configureAssortmentsModule } from '@unchainedshop/core-assortments';
import { bookmarkServices, configureBookmarksModule } from '@unchainedshop/core-bookmarks';
import { configureCountriesModule } from '@unchainedshop/core-countries';
import { configureCurrenciesModule } from '@unchainedshop/core-currencies';
import { configureDeliveryModule } from '@unchainedshop/core-delivery';
import { configureEnrollmentsModule } from '@unchainedshop/core-enrollments';
import { configureEventsModule } from '@unchainedshop/core-events';
import { configureFilesModule, fileServices } from '@unchainedshop/core-files';
import { configureFiltersModule } from '@unchainedshop/core-filters';
import { configureLanguagesModule } from '@unchainedshop/core-languages';
import { configureMessagingModule } from '@unchainedshop/core-messaging';
import { configureOrdersModule, orderServices } from '@unchainedshop/core-orders';
import { configurePaymentModule } from '@unchainedshop/core-payment';
import { configureProductsModule, productServices } from '@unchainedshop/core-products';
import { configureQuotationsModule } from '@unchainedshop/core-quotations';
import { configureUsersModule, userServices } from '@unchainedshop/core-users';
import { configureWarehousingModule } from '@unchainedshop/core-warehousing';
import { configureWorkerModule } from '@unchainedshop/core-worker';

export const initCore = async ({
  db,
  migrationRepository,
  modules,
  services,
  bulkImporter,
  options = {},
}: UnchainedCoreOptions): Promise<UnchainedCore> => {
  const accounts = await configureAccountsModule({
    db,
    options: options.accounts,
    migrationRepository,
  });
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
      accounts,
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
