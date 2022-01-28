import { UnchainedCoreOptions } from "@unchainedshop/types/api";
import { configureAccountsModule } from "meteor/unchained:core-accountsjs";
import { configureAssortmentsModule } from "meteor/unchained:core-assortments";
import {
  bookmarkServices,
  configureBookmarksModule,
} from "meteor/unchained:core-bookmarks";
import {
  configureCountriesModule,
  countryServices,
} from "meteor/unchained:core-countries";
import { configureCurrenciesModule } from "meteor/unchained:core-currencies";
import { configureDeliveryModule } from "meteor/unchained:core-delivery";
import { configureEnrollmentsModule } from "meteor/unchained:core-enrollments";
import { configureEventsModule } from "meteor/unchained:core-events";
import {
  configureFilesModule,
  fileServices,
} from "meteor/unchained:core-files-next";
import { configureFiltersModule } from "meteor/unchained:core-filters";
import { configureLanguagesModule } from "meteor/unchained:core-languages";
import { configureMessagingModule } from "meteor/unchained:core-messaging";
import {
  configureOrdersModule,
  orderServices,
} from "meteor/unchained:core-orders";
import {
  configurePaymentModule,
  paymentServices,
} from "meteor/unchained:core-payment";
import {
  configureProductsModule,
  productServices,
} from "meteor/unchained:core-products";
import { configureQuotationsModule } from "meteor/unchained:core-quotations";
import {
  configureUsersModule,
  userServices,
} from "meteor/unchained:core-users";
import { configureWarehousingModule } from "meteor/unchained:core-warehousing";
import { configureWorkerModule } from "meteor/unchained:core-worker";

export const initCore = async ({
  db,
  modules,
  bulkImporter,
  options = {},
}: UnchainedCoreOptions) => {
  const accounts = await configureAccountsModule();
  const assortments = await configureAssortmentsModule({
    db,
    options: options.assortments,
  });
  const bookmarks = await configureBookmarksModule({ db });
  const countries = await configureCountriesModule({ db });
  const currencies = await configureCurrenciesModule({ db });
  const delivery = await configureDeliveryModule({
    db,
    options: options.delivery,
  });
  const enrollments = await configureEnrollmentsModule({
    db,
    options: options.enrollments,
  });
  const events = await configureEventsModule({ db });
  const files = await configureFilesModule({ db });
  const filters = await configureFiltersModule({ db });
  const languages = await configureLanguagesModule({ db });
  const messaging = await configureMessagingModule({ db });
  const orders = await configureOrdersModule({
    db,
    options: options.orders,
  });
  const payment = await configurePaymentModule({
    db,
    options: options.paymentProviders,
  });
  const products = await configureProductsModule({ db });
  const quotations = await configureQuotationsModule({
    db,
    options: options.quotations,
  });
  const users = await configureUsersModule({ db });
  const warehousing = await configureWarehousingModule({ db });
  const worker = await configureWorkerModule({ db });

  // Configure custom modules
  const customModules = await Object.entries(modules).reduce(
    async (modulesPromise, [key, customModule]) => {
      return {
        ...(await modulesPromise),
        [key]: await customModule.configure({ db }),
      };
    },
    Promise.resolve({})
  );

  return {
    db,
    modules: {
      ...customModules,
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
    },
    services: {
      bookmarks: bookmarkServices,
      countries: countryServices,
      files: fileServices,
      orders: orderServices,
      payment: paymentServices,
      products: productServices,
      users: userServices,
    },
    bulkImporter,
    options,
  };
};
