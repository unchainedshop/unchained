import { Migrations } from 'meteor/percolate:migrations';
import configureUsers from 'meteor/unchained:core-users';
import configureLogger, { createLogger } from 'meteor/unchained:core-logger';
import configureDelivery from 'meteor/unchained:core-delivery';
import configurePayment from 'meteor/unchained:core-payment';
import configureWarehousing from 'meteor/unchained:core-warehousing';
import configureProducts from 'meteor/unchained:core-products';
import configureBookmarks from 'meteor/unchained:core-bookmarks';
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

const logger = createLogger('unchained:platform:migrations');

export default ({ modules = {} } = {}) => {
  Migrations.config({
    log: true,
    logger({ level, message }) {
      return logger.log({
        level,
        message,
      });
    },
    logIfLatest: false,
  });
  Migrations.unlock();

  configureLogger(modules.logger);
  configureWorker(modules.worker);
  configureMessaging(modules.messaging);
  configureCurrencies(modules.currencies);
  configureCountries(modules.countries);
  configureLanguages(modules.languages);
  configureDocuments(modules.documents);
  configureUsers(modules.users);
  configureDelivery(modules.delivery);
  configurePayment(modules.payment);
  configureWarehousing(modules.warehousing);
  configureProducts(modules.products);
  configureBookmarks(modules.bookmarks);
  configureQuotations(modules.quotations);
  configureOrders(modules.orders);
  configureAssortments(modules.assortments);
  configureFilters(modules.filters);
  configureSubscriptions(modules.subscriptions);
};
