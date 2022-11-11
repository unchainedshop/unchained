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
import setupDatatrans from './payment/datatrans-v2';
import { setupCryptopayWebhooks, configureCryptopayModule } from './payment/cryptopay';
import setupAppleIAP, { configureAppleTransactionsModule } from './payment/apple-iap';
import setupBity, { configureBityModule } from './payment/bity';
import setupStripe from './payment/stripe';
import setupPostfinance from './payment/postfinance-checkout';

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
import setupGridFSWebhook from './files/gridfs/gridfs-webhook';
import { configureGridFSFileUploadModule } from './files/gridfs';

// import './files/minio/minio-adapter';
// import setupMinio from './files/minio/minio-webhook';

export const defaultModules = {
  bity: {
    configure: configureBityModule,
  },
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

export const useDefaultMiddlewares = (unchainedApi, app) => {
  setupGridFSWebhook(app);
  setupCryptopayWebhooks(app);
  setupStripe(app);
  setupPostfinance(app);
  setupDatatrans(app);
  setupBity(app);
  setupAppleIAP(app);

  configureExportToken(unchainedApi);
  configureUpdateTokenOwnership(unchainedApi);
  configureGenerateOrderAutoscheduling();
};
