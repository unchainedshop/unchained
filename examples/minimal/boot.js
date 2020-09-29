import { Meteor } from 'meteor/meteor';
import { startPlatform } from 'meteor/unchained:platform';
import { Users } from 'meteor/unchained:core-users';
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';
import { Currencies } from 'meteor/unchained:core-currencies';
import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';

import 'meteor/unchained:core-delivery/plugins/post';
import 'meteor/unchained:core-delivery/plugins/pick-mup';
import 'meteor/unchained:core-delivery/plugins/send-message';
import 'meteor/unchained:core-delivery/plugins/stores';
import 'meteor/unchained:core-warehousing/plugins/google-sheets';
import 'meteor/unchained:core-discounting/plugins/half-price-manual';
import 'meteor/unchained:core-discounting/plugins/100-off';
import 'meteor/unchained:core-documents/plugins/smallinvoice';
import 'meteor/unchained:core-payment/plugins/invoice';
import 'meteor/unchained:core-payment/plugins/invoice-prepaid';
import 'meteor/unchained:core-payment/plugins/datatrans';
import 'meteor/unchained:core-payment/plugins/paypal-checkout';
import 'meteor/unchained:core-payment/plugins/stripe';
import 'meteor/unchained:core-payment/plugins/apple-iap';
import 'meteor/unchained:core-pricing/plugins/order-items';
import 'meteor/unchained:core-pricing/plugins/order-discount';
import 'meteor/unchained:core-pricing/plugins/order-delivery';
import 'meteor/unchained:core-pricing/plugins/order-payment';
import 'meteor/unchained:core-pricing/plugins/product-catalog-price';
import 'meteor/unchained:core-pricing/plugins/product-discount';
import 'meteor/unchained:core-pricing/plugins/product-swiss-tax';
import 'meteor/unchained:core-filters/plugins/strict-equal';
import 'meteor/unchained:core-filters/plugins/local-search';
import 'meteor/unchained:core-pricing/plugins/delivery-swiss-tax';
import 'meteor/unchained:core-quotations/plugins/manual';
import 'meteor/unchained:core-subscriptions/plugins/licensed';
import 'meteor/unchained:core-worker/plugins/external';
import 'meteor/unchained:core-worker/plugins/http-request';
import 'meteor/unchained:core-worker/plugins/heartbeat';
import 'meteor/unchained:core-worker/plugins/email';

const logger = console;

const initializeDatabase = () => {
  try {
    if (Users.find({ username: 'admin' }).count() > 0) {
      return;
    }

    const admin = Users.createUser({
      username: 'admin',
      roles: ['admin'],
      emails: [{ address: 'admin@localhost', verified: true }],
      profile: { address: {} },
      guest: false,
    });
    const languages = ['de', 'fr'].map((code, key) => {
      const isBase = key === 0;
      const language = Languages.createLanguage({
        isoCode: code,
        isActive: true,
        isBase,
        authorId: admin._id,
      });
      return language.isoCode;
    });
    const currencies = ['CHF'].map((code) => {
      const currency = Currencies.createCurrency({
        isoCode: code,
        isActive: true,
        authorId: admin._id,
      });
      return currency._id;
    });
    const countries = ['CH'].map((code, key) => {
      const isBase = key === 0;
      const country = Countries.createCountry({
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
    logger.error(e);
  }
};

Meteor.startup(() => {
  startPlatform({
    introspection: true,
    modules: {
      payment: {
        filterSupportedProviders: ({ providers }) => {
          return providers.sort((left, right) => {
            if (left.adapterKey < right.adapterKey) {
              return -1;
            }
            if (left.adapterKey > right.adapterKey) {
              return 1;
            }
            return 0;
          });
        },
      },
    },
  });
  initializeDatabase();

  embedControlpanelInMeteorWebApp(WebApp);
});
