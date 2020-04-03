import { Meteor } from 'meteor/meteor';
import configureUsers, { Users } from 'meteor/unchained:core-users';
import configureLogger from 'meteor/unchained:core-logger';
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
import createFixtures from './fixtures';

const { FIXTURES } = process.env;

export { createFixtures };
export default createFixtures;

Meteor.startup(() => {
  if (!Meteor.isServer) return;

  // connect domain model
  configureLogger();
  configureCurrencies();
  configureCountries();
  configureLanguages();
  configureDocuments();
  configureUsers();
  configureDelivery();
  configurePayment();
  configureWarehousing();
  configureProducts();
  configureBookmarks();
  configureQuotations();
  configureOrders();
  configureAssortments();
  configureFilters({ skipInvalidationOnStartup: true });
  configureSubscriptions();

  if (FIXTURES && Users.find({ username: 'admin' }).count() === 0) {
    createFixtures();
  }
});
