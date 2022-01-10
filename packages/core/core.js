import {
  accountsServices,
  accountsSettings,
  configureAccountsModule,
} from 'meteor/unchained:core-accountsjs';
import { configureAssortmentsModule } from 'meteor/unchained:core-assortments';
import {
  bookmarkServices,
  configureBookmarksModule,
} from 'meteor/unchained:core-bookmarks';
import {
  configureCountriesModule,
  countryServices,
} from 'meteor/unchained:core-countries';
import { configureCurrenciesModule } from 'meteor/unchained:core-currencies';
import { configureDeliveryModule } from 'meteor/unchained:core-delivery';
import { configureDocumentsModule } from 'meteor/unchained:core-documents';
import { configureEnrollmentsModule } from 'meteor/unchained:core-enrollments';
import { configureEventsModule } from 'meteor/unchained:core-events';
import {
  configureFilesModule,
  fileServices,
} from 'meteor/unchained:core-files-next';
import { configureFiltersModule } from 'meteor/unchained:core-filters';
import { configureLanguagesModule } from 'meteor/unchained:core-languages';
import { configureMessagingModule } from 'meteor/unchained:core-messaging';
import { configureOrdersModule } from 'meteor/unchained:core-orders';
import {
  configurePaymentModule,
  paymentServices,
} from 'meteor/unchained:core-payment';
import { configureProductsModule } from 'meteor/unchained:core-products';
import { configureQuotationsModule } from 'meteor/unchained:core-quotations';
import {
  configureUsersModule,
  userServices,
  usersSettings,
} from 'meteor/unchained:core-users';
import { configureWarehousingModule } from 'meteor/unchained:core-warehousing';
import { configureWorkerModule } from 'meteor/unchained:core-worker';

export const initCore = async ({
  db,
  modules = {},
  migrationRepository,
  ...otherComponents
} = {}) => {
  const moduleOptions = {
    migrationRepository,
  };

  const accounts = await configureAccountsModule();
  const assortments = await configureAssortmentsModule({ db });
  const bookmarks = await configureBookmarksModule({ db });
  const countries = await configureCountriesModule({ db });
  const currencies = await configureCurrenciesModule({ db });
  const delivery = await configureDeliveryModule({ db });
  const delivery = await configureDeliveryModule({ db });
  const documents = await configureDocumentsModule({ db });
  const enrollments = await configureEnrollmentsModule({ db });
  const events = await configureEventsModule({ db });
  const files = await configureFilesModule({ db });
  const filters = await configureFiltersModule({ db });
  const languages = await configureLanguagesModule({ db });
  const messaging = await configureMessagingModule({ db });
  const orders = await configureOrdersModule({ db });
  const payment = await configurePaymentModule({ db });
  const products = await configureProductsModule({ db });
  const quotations = await configureQuotationsModule({ db });
  const users = await configureUsersModule({ db });
  const warehousing = await configureWarehousingModule({ db });
  const worker = await configureWorkerModule({ db });

  accountsSettings(modules.accounts);
  assortmentsSettings();
  usersSettings(modules.users);

  return {
    modules: {
      accounts,
      assortments,
      bookmarks,
      countries,
      currencies,
      delivery,
      delivery,
      documents,
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
      accounts: accountsServices,
      bookmarks: bookmarkServices,
      countries: countryServices,
      payment: paymentServices,
      files: fileServices,
      users: userServices,
    },
    ...otherComponents,
  };
};
