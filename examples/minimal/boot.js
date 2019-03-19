import { Meteor } from 'meteor/meteor';
import { startPlatform } from 'meteor/unchained:platform';
import { Users } from 'meteor/unchained:core-users';
import { Factory } from 'meteor/dburles:factory';
import configureEmailTemplates from './templates';

import 'meteor/unchained:core-delivery/plugins/send-mail';
import 'meteor/unchained:core-warehousing/plugins/google-sheets';
import 'meteor/unchained:core-discounting/plugins/half-price';
import 'meteor/unchained:core-documents/plugins/smallinvoice';
import 'meteor/unchained:core-messaging/plugins/local-mail';
import 'meteor/unchained:core-payment/plugins/invoice';
import 'meteor/unchained:core-payment/plugins/invoice-prepaid';
import 'meteor/unchained:core-pricing/plugins/order-items';
import 'meteor/unchained:core-pricing/plugins/order-discount';
import 'meteor/unchained:core-pricing/plugins/order-delivery';
import 'meteor/unchained:core-pricing/plugins/order-payment';
import 'meteor/unchained:core-pricing/plugins/product-catalog-price';
import 'meteor/unchained:core-pricing/plugins/product-discount';
import 'meteor/unchained:core-pricing/plugins/product-swiss-tax';
import 'meteor/unchained:core-quotations/plugins/manual';

const logger = console;

const initializeDatabase = () => {
  try {
    if (Users.find({ username: 'admin' }).count() > 0) {
      return;
    }
    const admin = Factory.create('user', {
      username: 'admin',
      roles: ['admin'],
      emails: [{ address: 'admin@localhost', verified: true }],
      guest: false,
    });
    const languages = ['de', 'fr'].map((code, key) => {
      const isBase = (key === 0);
      const language = Factory.create('language', {
        isoCode: code, isActive: true, isBase, authorId: admin._id,
      });
      return language.isoCode;
    });
    const currencies = ['CHF'].map((code) => {
      const currency = Factory.create('currency', { isoCode: code, isActive: true, authorId: admin._id });
      return currency._id;
    });
    const countries = ['CH'].map((code, key) => {
      const isBase = (key === 0);
      const country = Factory.create('country', {
        isoCode: code,
        isBase,
        isActive: true,
        authorId: admin._id,
        defaultCurrencyId: currencies[key],
      });
      return country.isoCode;
    });
    logger.log(`
      initialized database with
      \ncountries: ${countries.join(',')}
      \ncurrencies: ${currencies.join(',')}
      \nlanguages: ${languages.join(',')}
      \nuser: admin@localhost / password`);
  } catch (e) {
    logger.log('database was already initialized');
  }
};

Meteor.startup(() => {
  configureEmailTemplates();
  initializeDatabase();
  startPlatform();
});
