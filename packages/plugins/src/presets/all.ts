import baseModules from './base.ts';
import './countries/ch.ts';
import cryptoModules from './crypto.ts';

// Delivery
import '../delivery/send-message.ts';
import '../delivery/stores.ts';

// Payment
import '../payment/invoice-prepaid.ts';
import '../payment/paypal-checkout.ts';
import appleTransactionsModules from '../payment/apple-iap/index.ts';
import saferpayTransactionsModules from '../payment/saferpay/index.ts';
import '../payment/stripe/index.ts';
import '../payment/postfinance-checkout/index.ts';
import '../payment/datatrans-v2/index.ts';
import '../payment/payrexx/index.ts';

// Filter & Search
import '../filters/strict-equal.ts';
import '../filters/local-search.ts';

// Workers
import '../worker/twilio.ts';
import '../worker/bulkgate.ts';
import '../worker/budgetsms.ts';
import '../worker/push-notification.ts';
import '../worker/enrollment-order-generator.ts';

const modules = {
  ...baseModules,
  ...cryptoModules,
  ...appleTransactionsModules,
  ...saferpayTransactionsModules,
};

export default modules;
