import { Meteor } from 'meteor/meteor';
import { startPlatform } from 'meteor/unchained:platform';
import { Users } from 'meteor/unchained:core-users';
import { Factory } from 'meteor/dburles:factory';
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';

import 'meteor/unchained:core-delivery/plugins/post';
import 'meteor/unchained:core-delivery/plugins/pick-mup';
import 'meteor/unchained:core-delivery/plugins/send-mail';
import 'meteor/unchained:core-delivery/plugins/stores';
import 'meteor/unchained:core-warehousing/plugins/google-sheets';
import 'meteor/unchained:core-discounting/plugins/half-price-manual';
import 'meteor/unchained:core-discounting/plugins/100-off';
import 'meteor/unchained:core-documents/plugins/smallinvoice';
import 'meteor/unchained:core-messaging/plugins/local-mail';
import 'meteor/unchained:core-payment/plugins/invoice';
import 'meteor/unchained:core-payment/plugins/invoice-prepaid';
import 'meteor/unchained:core-payment/plugins/datatrans';
import 'meteor/unchained:core-pricing/plugins/order-items';
import 'meteor/unchained:core-pricing/plugins/order-discount';
import 'meteor/unchained:core-pricing/plugins/order-delivery';
import 'meteor/unchained:core-pricing/plugins/order-payment';
import 'meteor/unchained:core-pricing/plugins/product-catalog-price';
import 'meteor/unchained:core-pricing/plugins/product-discount';
import 'meteor/unchained:core-pricing/plugins/product-swiss-tax';
import 'meteor/unchained:core-filters/plugins/strict-equal';
import 'meteor/unchained:core-filters/plugins/local-search';
import 'meteor/unchained:core-quotations/plugins/manual';
import 'meteor/unchained:core-subscriptions/plugins/licensed';
import 'meteor/unchained:core-worker/plugins/external';
import 'meteor/unchained:core-worker/plugins/http-request';
import 'meteor/unchained:core-worker/plugins/heartbeat';

import { WorkerDirector } from 'meteor/unchained:core-worker';
import EventListenerWorker from 'meteor/unchained:core-worker/workers/eventListener';
import CronWorker from 'meteor/unchained:core-worker/workers/cron';
import FailedRescheduler from 'meteor/unchained:core-worker/schedulers/failedRescheduler';

import configureEmailTemplates from './templates';

const { DISABLE_WORKER } = process.env;

new FailedRescheduler({ WorkerDirector }).start();

if (!DISABLE_WORKER) {
  new EventListenerWorker({ WorkerDirector, workerId: 'EventWorker' }).start();
  new CronWorker({
    WorkerDirector,
    workerId: 'CronWorker',
    cronText: 'every 2 seconds',
  }).start();
}

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
      const isBase = key === 0;
      const language = Factory.create('language', {
        isoCode: code,
        isActive: true,
        isBase,
        authorId: admin._id,
      });
      return language.isoCode;
    });
    const currencies = ['CHF'].map((code) => {
      const currency = Factory.create('currency', {
        isoCode: code,
        isActive: true,
        authorId: admin._id,
      });
      return currency._id;
    });
    const countries = ['CH'].map((code, key) => {
      const isBase = key === 0;
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

const typeDefs = [
  /* GraphQL */ `
    extend enum WorkType {
      ${WorkerDirector.getActivePluginTypes().join(',')}
    }
  `,
];

Meteor.startup(() => {
  configureEmailTemplates();
  initializeDatabase();
  startPlatform({ introspection: true, typeDefs });
  embedControlpanelInMeteorWebApp(WebApp);
});
