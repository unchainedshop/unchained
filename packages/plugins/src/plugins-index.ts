import { useMiddlewareWithCurrentContext } from '@unchainedshop/api/express';
import { UnchainedCore } from '@unchainedshop/types/core';
import express from 'express';

// Delivery
import './delivery/post';
import './delivery/pick-mup';
import './delivery/send-message';
import './delivery/stores';

// Payment
import './payment/invoice';
import './payment/invoice-prepaid';
import './payment/paypal-checkout';
import './payment/worldline-saferpay';
import { datatransHandler } from './payment/datatrans-v2';
import { configureCryptopayModule, cryptopayHandler } from './payment/cryptopay';
import { appleIAPHandler, configureAppleTransactionsModule } from './payment/apple-iap';
import { stripeHandler } from './payment/stripe';
import { postfinanceCheckoutHandler } from './payment/postfinance-checkout';

// Warehousing
import './warehousing/store';
import './warehousing/eth-minter';

// Pricing
import './pricing/discount-half-price-manual';
import './pricing/discount-100-off';
import './pricing/free-payment';
import './pricing/free-delivery';
import './pricing/order-items';
import './pricing/order-discount';
import './pricing/order-delivery';
import './pricing/order-payment';
import './pricing/product-catalog-price';
import './pricing/product-price-rateconversion';
import './pricing/product-discount';
import './pricing/product-swiss-tax';
import './pricing/delivery-swiss-tax';

// Filter & Search
import './filters/strict-equal';
import './filters/local-search';

// Quotations
import './quotations/manual';

// Enrollments
import './enrollments/licensed';

// Event Queue
import './events/node-event-emitter';

// Workers
import './worker/bulk-import';
import './worker/zombie-killer';
import './worker/message';
import './worker/external';
import './worker/http-request';
import './worker/heartbeat';
import './worker/email';
import './worker/sms';
import './worker/update-ecb-rates';
import './worker/update-coinbase-rates';
import { configureExportToken } from './worker/export-token';
import { configureGenerateOrderAutoscheduling } from './worker/enrollment-order-generator';
import { configureUpdateTokenOwnership } from './worker/update-token-ownership';

// Asset Management
import './files/gridfs/gridfs-adapter';
import { gridfsHandler } from './files/gridfs/gridfs-webhook';
import { configureGridFSFileUploadModule } from './files/gridfs';

const {
  CRYPTOPAY_WEBHOOK_PATH = '/payment/cryptopay',
  STRIPE_WEBHOOK_PATH = '/payment/stripe',
  PFCHECKOUT_WEBHOOK_PATH = '/payment/postfinance-checkout',
  DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook',
  APPLE_IAP_WEBHOOK_PATH = '/payment/apple-iap',
  // MINIO_PUT_SERVER_PATH = '/minio',
  GRIDFS_PUT_SERVER_PATH = '/gridfs',
} = process.env;

// import './files/minio/minio-adapter';
// import { minioHandler } from './files/minio/minio-webhook';

export const defaultModules = {
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
