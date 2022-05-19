import { UnchainedCore, UnchainedCoreOptions } from '@unchainedshop/types/core';
import { configureAccountsModule } from 'meteor/unchained:core-accountsjs';
import { configureAssortmentsModule } from 'meteor/unchained:core-assortments';
import { bookmarkServices, configureBookmarksModule } from 'meteor/unchained:core-bookmarks';
import { configureCountriesModule, countryServices } from 'meteor/unchained:core-countries';
import { configureCurrenciesModule } from 'meteor/unchained:core-currencies';
import { configureDeliveryModule } from 'meteor/unchained:core-delivery';
import { configureEnrollmentsModule } from 'meteor/unchained:core-enrollments';
import { configureEventsModule } from 'meteor/unchained:core-events';
import { configureFilesModule, fileServices } from 'meteor/unchained:core-files';
import { configureFiltersModule } from 'meteor/unchained:core-filters';
import { configureLanguagesModule } from 'meteor/unchained:core-languages';
import { configureMessagingModule } from 'meteor/unchained:core-messaging';
import { configureOrdersModule, orderServices } from 'meteor/unchained:core-orders';
import { configurePaymentModule, paymentServices } from 'meteor/unchained:core-payment';
import { configureProductsModule, productServices } from 'meteor/unchained:core-products';
import { configureQuotationsModule } from 'meteor/unchained:core-quotations';
import { configureUsersModule, userServices } from 'meteor/unchained:core-users';
import { configureWarehousingModule } from 'meteor/unchained:core-warehousing';
import { configureWorkerModule } from 'meteor/unchained:core-worker';

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
      countries: countryServices,
      files: fileServices,
      orders: orderServices,
      payment: paymentServices,
      products: productServices,
      users: userServices,
      ...services,
    },
    bulkImporter,
    options,
  };
};
