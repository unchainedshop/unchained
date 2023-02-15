import './load_env';
import express from 'express';
import cookieParser from 'cookie-parser';

import { startPlatform, withAccessToken } from '@unchainedshop/platform';
import serveStatic from 'serve-static';

import '@unchainedshop/plugins/delivery/post';
import '@unchainedshop/plugins/delivery/pick-mup';
import '@unchainedshop/plugins/delivery/send-message';
import '@unchainedshop/plugins/delivery/stores';
import '@unchainedshop/plugins/warehousing/store';

import '@unchainedshop/plugins/payment/invoice';
import '@unchainedshop/plugins/payment/invoice-prepaid';
import '@unchainedshop/plugins/payment/paypal-checkout';
import '@unchainedshop/plugins/payment/worldline-saferpay';
import setupDatatrans from '@unchainedshop/plugins/payment/datatrans-v2';
import setupCryptopay from '@unchainedshop/plugins/payment/cryptopay';
import setupAppleIAP, {
  configureAppleTransactionsModule,
} from '@unchainedshop/plugins/payment/apple-iap';
import setupBity, { configureBityModule } from '@unchainedshop/plugins/payment/bity';
import setupStripe from '@unchainedshop/plugins/payment/stripe';
import setupPostfinance from '@unchainedshop/plugins/payment/postfinance-checkout';

import '@unchainedshop/plugins/pricing/discount-half-price-manual';
import '@unchainedshop/plugins/pricing/discount-100-off';
import '@unchainedshop/plugins/pricing/free-payment';
import '@unchainedshop/plugins/pricing/free-delivery';
import '@unchainedshop/plugins/pricing/order-items';
import '@unchainedshop/plugins/pricing/order-discount';
import '@unchainedshop/plugins/pricing/order-delivery';
import '@unchainedshop/plugins/pricing/order-payment';
import '@unchainedshop/plugins/pricing/product-catalog-price';
import '@unchainedshop/plugins/pricing/product-price-coinbase-exchange';
import setupCryptopayPricing from '@unchainedshop/plugins/pricing/product-price-cryptopay';
import '@unchainedshop/plugins/pricing/product-price-rateconversion';
import '@unchainedshop/plugins/pricing/product-discount';
import '@unchainedshop/plugins/pricing/product-swiss-tax';
import '@unchainedshop/plugins/pricing/delivery-swiss-tax';

import '@unchainedshop/plugins/filters/strict-equal';
import '@unchainedshop/plugins/filters/local-search';

import '@unchainedshop/plugins/quotations/manual';

import '@unchainedshop/plugins/enrollments/licensed';

import '@unchainedshop/plugins/worker/BulkImportWorker';
import '@unchainedshop/plugins/worker/ZombieKillerWorker';
import '@unchainedshop/plugins/worker/GenerateOrderWorker';
import '@unchainedshop/plugins/worker/MessageWorker';
import '@unchainedshop/plugins/worker/external';
import '@unchainedshop/plugins/worker/http-request';
import '@unchainedshop/plugins/worker/heartbeat';
import '@unchainedshop/plugins/worker/email';
import '@unchainedshop/plugins/worker/sms';

import '@unchainedshop/plugins/files/gridfs/gridfs-adapter';
import setupGridFSWebhook from '@unchainedshop/plugins/files/gridfs/gridfs-webhook';
import { configureGridFSFileUploadModule } from '@unchainedshop/plugins/files/gridfs';

// import '@unchainedshop/plugins/files/minio/minio-adapter';
// import setupMinio from '@unchainedshop/plugins/files/minio/minio-webhook';

import '@unchainedshop/plugins/events/node-event-emitter';

import { configureGenerateOrderAutoscheduling } from '@unchainedshop/plugins/worker/GenerateOrderWorker';

import loginWithSingleSignOn from './login-with-single-sign-on';
import seed from './seed';

const start = async () => {
  const app = express();
  app.use(cookieParser());

  const unchainedAPI = await startPlatform({
    expressApp: app,
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

  await seed(unchainedAPI);

  // The following lines will activate SSO from Unchained Cloud to your instance,
  // if you want to further secure your app and close this rabbit hole,
  // remove the following lines
  const singleSignOn = loginWithSingleSignOn(unchainedAPI);
  app.use('/', singleSignOn);
  app.use('/.well-known/unchained/cloud-sso', singleSignOn);
  app.use(serveStatic('static', { index: ['index.html'] }));
  // until here

  setupGridFSWebhook(app);
  setupCryptopay(app);
  setupCryptopayPricing(app);
  setupStripe(app);
  setupPostfinance(app);
  setupDatatrans(app);
  setupBity(app);
  setupAppleIAP(app);

  configureGenerateOrderAutoscheduling();

  await app.listen({ port: process.env.PORT || 3000 });
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();
