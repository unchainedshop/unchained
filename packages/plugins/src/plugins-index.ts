import { useMiddlewareWithCurrentContext } from '@unchainedshop/api/express/index.js';
import { ModuleInput, UnchainedCore } from '@unchainedshop/types/core.js';
import express from 'express';

// Delivery
import './delivery/post.js';
import './delivery/pick-mup.js';
import './delivery/send-message.js';
import './delivery/stores.js';

// Payment
import './payment/invoice.js';
import './payment/invoice-prepaid.js';
import './payment/paypal-checkout.js';
import './payment/worldline-saferpay/index.js';
import { datatransHandler } from './payment/datatrans-v2/index.js';
import { configureCryptopayModule, cryptopayHandler } from './payment/cryptopay/index.js';
import { appleIAPHandler, configureAppleTransactionsModule } from './payment/apple-iap/index.js';
import { stripeHandler } from './payment/stripe/index.js';
import { postfinanceCheckoutHandler } from './payment/postfinance-checkout/index.js';

import { payrexxHandler } from './payment/payrexx/index.js';

// Warehousing
import './warehousing/store.js';
import './warehousing/eth-minter.js';

// Pricing
import './pricing/discount-half-price-manual.js';
import './pricing/discount-100-off.js';
import './pricing/free-payment.js';
import './pricing/free-delivery.js';
import './pricing/order-items.js';
import './pricing/order-discount.js';
import './pricing/order-delivery.js';
import './pricing/order-payment.js';
import './pricing/product-catalog-price.js';
import './pricing/product-price-rateconversion.js';
import './pricing/product-discount.js';
import './pricing/product-swiss-tax.js';
import './pricing/delivery-swiss-tax.js';

// Filter & Search
import './filters/strict-equal.js';
import './filters/local-search.js';

// Quotations
import './quotations/manual.js';

// Enrollments
import './enrollments/licensed.js';

// Event Queue
import './events/node-event-emitter.js';

// Workers
import './worker/bulk-import.js';
import './worker/zombie-killer.js';
import './worker/message.js';
import './worker/external.js';
import './worker/http-request.js';
import './worker/heartbeat.js';
import './worker/email.js';
import './worker/sms.js';
import './worker/push-notification.js';
import './worker/update-ecb-rates.js';
import './worker/error-notifications.js';
import './worker/update-coinbase-rates.js';
import { configureExportToken } from './worker/export-token.js';
import { configureGenerateOrderAutoscheduling } from './worker/enrollment-order-generator.js';
import { configureUpdateTokenOwnership } from './worker/update-token-ownership.js';

// Asset Management
import './files/gridfs/gridfs-adapter.js';
import { gridfsHandler } from './files/gridfs/gridfs-webhook.js';
import { configureGridFSFileUploadModule } from './files/gridfs/index.js';

import './accounts/google-oauth.js';
import './accounts/linkedin-oauth.js';

const {
  CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay',
  STRIPE_WEBHOOK_PATH = '/payment/stripe',
  PAYREXX_WEBHOOK_PATH = '/payment/payrexx',
  PFCHECKOUT_WEBHOOK_PATH = '/payment/postfinance-checkout',
  DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook',
  APPLE_IAP_WEBHOOK_PATH = '/payment/apple-iap',
  // MINIO_PUT_SERVER_PATH = '/minio',
  GRIDFS_PUT_SERVER_PATH = '/gridfs',
} = process.env;

// import './files/minio/minio-adapter';
// import { minioHandler } from './files/minio/minio-webhook';

export const defaultModules: Record<
  string,
  {
    configure: (params: ModuleInput<any>) => any;
  }
> = {
  appleTransactions: {
    configure: configureAppleTransactionsModule,
  },
  gridfsFileUploads: {
    configure: configureGridFSFileUploadModule,
  },
  cryptopay: {
    configure: configureCryptopayModule,
  },
};

export const connectDefaultPluginsToExpress4 = (
  app,
  { unchainedAPI }: { unchainedAPI: UnchainedCore },
) => {
  useMiddlewareWithCurrentContext(app, GRIDFS_PUT_SERVER_PATH, gridfsHandler);

  useMiddlewareWithCurrentContext(app, CRYPTOPAY_WEBHOOK_PATH, express.json(), cryptopayHandler);

  useMiddlewareWithCurrentContext(
    app,
    STRIPE_WEBHOOK_PATH,
    express.raw({ type: 'application/json' }),
    stripeHandler,
  );

  useMiddlewareWithCurrentContext(
    app,
    PFCHECKOUT_WEBHOOK_PATH,
    express.json(),
    postfinanceCheckoutHandler,
  );

  useMiddlewareWithCurrentContext(
    app,
    DATATRANS_WEBHOOK_PATH,
    express.text({
      type: 'application/json',
    }),
    datatransHandler,
  );

  useMiddlewareWithCurrentContext(
    app,
    APPLE_IAP_WEBHOOK_PATH,
    express.json({
      strict: false,
    }),
    appleIAPHandler,
  );

  useMiddlewareWithCurrentContext(
    app,
    PAYREXX_WEBHOOK_PATH,
    express.json({ type: 'application/json' }),
    payrexxHandler,
  );

  // useMiddlewareWithCurrentContext(
  //   app,
  //   MINIO_PUT_SERVER_PATH,
  //   express.json({
  //     strict: false,
  //   }),
  //   minioHandler
  // );

  configureExportToken(unchainedAPI);
  configureUpdateTokenOwnership(unchainedAPI);
  configureGenerateOrderAutoscheduling();
};
