import configureUsers from 'meteor/unchained:core-users';
import configureAccounts from 'meteor/unchained:core-accountsjs';
import configureLogger from 'meteor/unchained:core-logger';
import configureDelivery from 'meteor/unchained:core-delivery';
import configurePayment from 'meteor/unchained:core-payment';
import configureWarehousing from 'meteor/unchained:core-warehousing';
import configureProducts from 'meteor/unchained:core-products';
import configureBookmarks, {
  services as bookmarkServices,
} from 'meteor/unchained:core-bookmarks';
import configureQuotations from 'meteor/unchained:core-quotations';
import configureCurrencies from 'meteor/unchained:core-currencies';
import configureCountries from 'meteor/unchained:core-countries';
import configureLanguages from 'meteor/unchained:core-languages';
import configureDocuments from 'meteor/unchained:core-documents';
import configureOrders from 'meteor/unchained:core-orders';
import configureAssortments from 'meteor/unchained:core-assortments';
import configureFilters from 'meteor/unchained:core-filters';
import configureSubscriptions from 'meteor/unchained:core-subscriptions';
import configureWorker from 'meteor/unchained:core-worker';
import configureMessaging from 'meteor/unchained:core-messaging';
import configureEvents from 'meteor/unchained:core-events';

export default async ({ modules = {}, ...otherComponents } = {}) => {
  configureLogger(modules.logger);
  configureWorker(modules.worker);
  configureMessaging(modules.messaging);
  configureCurrencies(modules.currencies);
  configureCountries(modules.countries);
  configureLanguages(modules.languages);
  configureDocuments(modules.documents);
  configureUsers(modules.users);
  configureAccounts(modules.accounts);
  configureDelivery(modules.delivery);
  configurePayment(modules.payment);
  configureWarehousing(modules.warehousing);
  configureProducts(modules.products);
  const bookmarks = await configureBookmarks(modules.bookmarks);
  configureQuotations(modules.quotations);
  configureOrders(modules.orders);
  configureAssortments(modules.assortments);
  configureFilters(modules.filters);
  configureSubscriptions(modules.subscriptions);
  configureEvents(modules.events);
  return {
    modules: {
      bookmarks,
    },
    services: {
      ...bookmarkServices,
    },
    ...otherComponents,
  };
};
