import baseModules from './base.js';
import './countries/ch.js';
import cryptoModules from './crypto.js';

// Delivery
import '../delivery/send-message.js';
import '../delivery/stores.js';

// Payment
import '../payment/invoice-prepaid.js';
import '../payment/paypal-checkout.js';
import appleTransactionsModules from '../payment/apple-iap/index.js';
import saferpayTransactionsModules from '../payment/saferpay/index.js';
import '../payment/stripe/index.js';
import '../payment/postfinance-checkout/index.js';
import '../payment/datatrans-v2/index.js';
import '../payment/payrexx/index.js';

// Filter & Search
import '../filters/strict-equal.js';
import '../filters/local-search.js';

// Workers
import '../worker/twilio.js';
import '../worker/bulkgate.js';
import '../worker/push-notification.js';
import '../worker/enrollment-order-generator.js';

const modules = {
  ...baseModules,
  ...cryptoModules,
  ...appleTransactionsModules,
  ...saferpayTransactionsModules,
};

export default modules;
