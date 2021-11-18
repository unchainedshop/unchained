import configureUsers from 'meteor/unchained:core-users';
import configureAccounts from 'meteor/unchained:core-accountsjs';
import configureDelivery from 'meteor/unchained:core-delivery';
import configurePayment from 'meteor/unchained:core-payment';
import configureWarehousing from 'meteor/unchained:core-warehousing';
import configureProducts from 'meteor/unchained:core-products';
import configureQuotations from 'meteor/unchained:core-quotations';
import configureCurrencies from 'meteor/unchained:core-currencies';
import configureCountries from 'meteor/unchained:core-countries';
import configureLanguages from 'meteor/unchained:core-languages';
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
import { configureEventsModule } from 'meteor/unchained:core-events';

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
  const bookmarks = await configureBookmarksModule({ db });

  configureWorker(modules.worker, moduleOptions);
  configureUsers(modules.users, moduleOptions);
  configureMessaging(modules.messaging, moduleOptions);
  configureCurrencies(modules.currencies, moduleOptions);
  configureCountries(modules.countries, moduleOptions);
  configureLanguages(modules.languages, moduleOptions);
  configureDocuments(modules.documents, moduleOptions);
  configureAccounts(modules.accounts, moduleOptions);
  configureDelivery(modules.delivery, moduleOptions);
  configurePayment(modules.payment, moduleOptions);
  configureWarehousing(modules.warehousing, moduleOptions);
  configureProducts(modules.products, moduleOptions);
  configureQuotations(modules.quotations, moduleOptions);
  configureOrders(modules.orders, moduleOptions);
  configureAssortments(modules.assortments, moduleOptions);
  configureFilters(modules.filters, moduleOptions);
  configureEnrollments(modules.enrollments, moduleOptions);

  return {
    modules: {
      events,
      bookmarks,
    },
    services: {
      bookmarks: bookmarkServices,
    },
    ...otherComponents,
  };
};
