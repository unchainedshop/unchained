import configureUsers from 'meteor/unchained:core-users';
import configureAccounts from 'meteor/unchained:core-accountsjs';
import configureDelivery from 'meteor/unchained:core-delivery';
import configureWarehousing from 'meteor/unchained:core-warehousing';
import configureProducts from 'meteor/unchained:core-products';
import configureQuotations from 'meteor/unchained:core-quotations';
import configureDocuments from 'meteor/unchained:core-documents';
import configureOrders from 'meteor/unchained:core-orders';
import configureAssortments from 'meteor/unchained:core-assortments';
import configureFilters from 'meteor/unchained:core-filters';
import configureEnrollments from 'meteor/unchained:core-enrollments';
import configureWorker from 'meteor/unchained:core-worker';
import configureMessaging from 'meteor/unchained:core-messaging';

import {
  configureBookmarksModule,
  bookmarkServices,
} from 'meteor/unchained:core-bookmarks';
import {
  configureCountriesModule,
  countryServices,
} from 'meteor/unchained:core-countries';
import { configureCurrenciesModule } from 'meteor/unchained:core-currencies';
import { configureEventsModule } from 'meteor/unchained:core-events';
import {
  configureFilesModule,
  fileServices,
} from 'meteor/unchained:core-files-next';
import { configureLanguagesModule } from 'meteor/unchained:core-languages';
import {
  configurePaymentModule,
  paymentServices,
} from 'meteor/unchained:core-payment';

export const initCore = async ({
  db,
  modules = {},
  migrationRepository,
  ...otherComponents
} = {}) => {
  const moduleOptions = {
    migrationRepository,
  };

  const events = await configureEventsModule({ db });
  const files = await configureFilesModule({ db });
  const bookmarks = await configureBookmarksModule({ db });
  const countries = await configureCountriesModule({ db });
  const currencies = await configureCurrenciesModule({ db });
  const languages = await configureLanguagesModule({ db });
  const payment = await configurePaymentModule({ db });

  configureWorker(modules.worker, moduleOptions);
  configureUsers(modules.users, moduleOptions);
  configureMessaging(modules.messaging, moduleOptions);
  configureDocuments(modules.documents, moduleOptions);
  configureAccounts(modules.accounts, moduleOptions);
  configureDelivery(modules.delivery, moduleOptions);
  configureWarehousing(modules.warehousing, moduleOptions);
  configureProducts(modules.products, moduleOptions);
  configureQuotations(modules.quotations, moduleOptions);
  configureOrders(modules.orders, moduleOptions);
  configureAssortments(modules.assortments, moduleOptions);
  configureFilters(modules.filters, moduleOptions);
  configureEnrollments(modules.enrollments, moduleOptions);

  return {
    modules: {
      bookmarks,
      countries,
      currencies,
      events,
      files,
      languages,
      payment,
    },
    services: {
      bookmark: bookmarkServices,
      country: countryServices,
      payment: paymentServices,
      files: fileServices
    },
    ...otherComponents,
  };
};
