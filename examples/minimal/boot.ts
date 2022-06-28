import { Meteor } from 'meteor/meteor';
import { startPlatform, withAccessToken } from 'meteor/unchained:platform';
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';

import 'meteor/unchained:core-delivery/plugins/post';
import 'meteor/unchained:core-delivery/plugins/pick-mup';
import 'meteor/unchained:core-delivery/plugins/send-message';
import 'meteor/unchained:core-delivery/plugins/stores';
import 'meteor/unchained:core-delivery/plugins/free-delivery';
import 'meteor/unchained:core-delivery/plugins/delivery-swiss-tax';

import 'meteor/unchained:core-warehousing/plugins/store';

import 'meteor/unchained:core-orders/plugins/discount-half-price-manual';
import 'meteor/unchained:core-orders/plugins/discount-100-off';

import 'meteor/unchained:core-payment/plugins/invoice';
import 'meteor/unchained:core-payment/plugins/invoice-prepaid';
import 'meteor/unchained:core-payment/plugins/datatrans-v2';
import 'meteor/unchained:core-payment/plugins/paypal-checkout';
import 'meteor/unchained:core-payment/plugins/cryptopay';
import { configureAppleTransactionsModule } from 'meteor/unchained:core-payment/plugins/apple-iap';
import 'meteor/unchained:core-payment/plugins/stripe';
import 'meteor/unchained:core-payment/plugins/postfinance-checkout';
import 'meteor/unchained:core-payment/plugins/worldline-saferpay';
import { configureBityModule } from 'meteor/unchained:core-payment/plugins/bity';
import 'meteor/unchained:core-payment/plugins/free-payment';

import 'meteor/unchained:core-orders/plugins/order-items';
import 'meteor/unchained:core-orders/plugins/order-discount';
import 'meteor/unchained:core-orders/plugins/order-delivery';
import 'meteor/unchained:core-orders/plugins/order-payment';

import 'meteor/unchained:core-products/plugins/product-catalog-price';
import 'meteor/unchained:core-products/plugins/product-price-coinbase-exchange';
import 'meteor/unchained:core-products/plugins/product-price-cryptopay';
import 'meteor/unchained:core-products/plugins/product-price-rateconversion';
import 'meteor/unchained:core-products/plugins/product-discount';
import 'meteor/unchained:core-products/plugins/product-swiss-tax';

import 'meteor/unchained:core-filters/plugins/strict-equal';
import 'meteor/unchained:core-filters/plugins/local-search';

import 'meteor/unchained:core-quotations/plugins/manual';

import 'meteor/unchained:core-enrollments/plugins/licensed';

import '@unchainedshop/plugins/lib/worker/external';
import '@unchainedshop/plugins/lib/worker/http-request';
import '@unchainedshop/plugins/lib/worker/heartbeat';
import '@unchainedshop/plugins/lib/worker/email';
import '@unchainedshop/plugins/lib/worker/sms';

import '@unchainedshop/plugins/lib/files/gridfs/gridfs-adapter';
import '@unchainedshop/plugins/lib/files/gridfs/gridfs-webhook';
import { configureGridFSFileUploadModule } from '@unchainedshop/plugins/lib/files/gridfs';

// import '@unchainedshop/plugins/lib/files/minio/minio-adapter';
// import '@unchainedshop/plugins/lib/files/minio/minio-webhook';

import '@unchainedshop/plugins/lib/events/node-event-emitter';

import loginWithSingleSignOn from './login-with-single-sign-on';
import seed from './seed';

Meteor.startup(async () => {
  const unchainedApi = await startPlatform({
    introspection: true,
    playground: true,
    tracing: true,
    modules: {
      bity: {
        configure: configureBityModule,
      },
      appleTransactions: {
        configure: configureAppleTransactionsModule,
      },
      gridfsFileUploads: {
        configure: configureGridFSFileUploadModule,
      },
    },
    options: {
      accounts: {
        password: {
          twoFactor: {
            appName: 'Example',
          },
        },
      },
      payment: {
        filterSupportedProviders: async ({ providers }) => {
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
    context: withAccessToken(),
  });

  seed(unchainedApi);

  // The following lines will activate SSO from Unchained Cloud to your instance,
  // if you want to further secure your app and close this rabbit hole,
  // remove the following lines
  const singleSignOn = loginWithSingleSignOn(unchainedApi);
  WebApp.connectHandlers.use('/', singleSignOn);
  WebApp.connectHandlers.use('/.well-known/unchained/cloud-sso', singleSignOn);
  // until here

  embedControlpanelInMeteorWebApp(WebApp);
});
