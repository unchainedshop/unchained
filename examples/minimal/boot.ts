import { Meteor } from 'meteor/meteor';
import { startPlatform, withAccessToken } from 'meteor/unchained:platform';
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';

import '@unchainedshop/plugins/lib/delivery/post';
import '@unchainedshop/plugins/lib/delivery/pick-mup';
import '@unchainedshop/plugins/lib/delivery/send-message';
import '@unchainedshop/plugins/lib/delivery/stores';

import '@unchainedshop/plugins/lib/warehousing/store';

import '@unchainedshop/plugins/lib/payment/invoice';
import '@unchainedshop/plugins/lib/payment/invoice-prepaid';
import '@unchainedshop/plugins/lib/payment/datatrans-v2';
import '@unchainedshop/plugins/lib/payment/paypal-checkout';
import '@unchainedshop/plugins/lib/payment/cryptopay';
import { configureAppleTransactionsModule } from '@unchainedshop/plugins/lib/payment/apple-iap';
import '@unchainedshop/plugins/lib/payment/stripe';
import '@unchainedshop/plugins/lib/payment/postfinance-checkout';
import '@unchainedshop/plugins/lib/payment/worldline-saferpay';
import { configureBityModule } from '@unchainedshop/plugins/lib/payment/bity';

import '@unchainedshop/plugins/lib/pricing/discount-half-price-manual';
import '@unchainedshop/plugins/lib/pricing/discount-100-off';
import '@unchainedshop/plugins/lib/pricing/free-payment';
import '@unchainedshop/plugins/lib/pricing/free-delivery';
import '@unchainedshop/plugins/lib/pricing/order-items';
import '@unchainedshop/plugins/lib/pricing/order-discount';
import '@unchainedshop/plugins/lib/pricing/order-delivery';
import '@unchainedshop/plugins/lib/pricing/order-payment';
import '@unchainedshop/plugins/lib/pricing/product-catalog-price';
import '@unchainedshop/plugins/lib/pricing/product-price-coinbase-exchange';
import '@unchainedshop/plugins/lib/pricing/product-price-cryptopay';
import '@unchainedshop/plugins/lib/pricing/product-price-rateconversion';
import '@unchainedshop/plugins/lib/pricing/product-discount';
import '@unchainedshop/plugins/lib/pricing/product-swiss-tax';
import '@unchainedshop/plugins/lib/pricing/delivery-swiss-tax';

import '@unchainedshop/plugins/lib/filters/strict-equal';
import '@unchainedshop/plugins/lib/filters/local-search';

import '@unchainedshop/plugins/lib/quotations/manual';

import '@unchainedshop/plugins/lib/enrollments/licensed';

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
