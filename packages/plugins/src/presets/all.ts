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

// Filter & Search
import '../filters/strict-equal.js';
import '../filters/local-search.js';

// Workers
import '../worker/sms.js';
import '../worker/push-notification.js';
import '../worker/enrollment-order-generator.js';

const modules = {
  ...baseModules,
  ...cryptoModules,
  ...appleTransactionsModules,
  ...saferpayTransactionsModules,
};

export default modules;
