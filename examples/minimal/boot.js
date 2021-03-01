import { Meteor } from 'meteor/meteor';
import { startPlatform } from 'meteor/unchained:platform';
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';

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
import 'meteor/unchained:core-payment/plugins/stripe-charges';
import 'meteor/unchained:core-payment/plugins/bity';
import 'meteor/unchained:core-payment/plugins/apple-iap';
import 'meteor/unchained:core-pricing/plugins/order-items';
import 'meteor/unchained:core-pricing/plugins/order-discount';
import 'meteor/unchained:core-pricing/plugins/order-delivery';
import 'meteor/unchained:core-pricing/plugins/order-payment';
import 'meteor/unchained:core-pricing/plugins/product-catalog-price';
import 'meteor/unchained:core-pricing/plugins/product-price-coinbase-exchange';
import 'meteor/unchained:core-pricing/plugins/product-discount';
import 'meteor/unchained:core-pricing/plugins/product-swiss-tax';
import 'meteor/unchained:core-pricing/plugins/delivery-swiss-tax';
import 'meteor/unchained:core-filters/plugins/strict-equal';
import 'meteor/unchained:core-filters/plugins/local-search';
import 'meteor/unchained:core-quotations/plugins/manual';
import 'meteor/unchained:core-subscriptions/plugins/licensed';
import 'meteor/unchained:core-worker/plugins/external';
import 'meteor/unchained:core-worker/plugins/http-request';
import 'meteor/unchained:core-worker/plugins/heartbeat';
import 'meteor/unchained:core-worker/plugins/email';
import 'meteor/unchained:core-events/plugins/node-event-emitter';
import 'meteor/unchained:core-events/plugins/motomo-tracker';

import seed from './seed';

Meteor.startup(async () => {
  await startPlatform({
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
      accounts: {
        server: {
          loginExpirationInDays: 0.5,
        },
      },
    },
  });
  seed();

  embedControlpanelInMeteorWebApp(WebApp);
});
