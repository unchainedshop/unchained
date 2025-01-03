import { ModuleInput } from '@unchainedshop/mongodb';

import baseModules from './base.js';
import './countries/ch.js';
import cryptoModules from './crypto.js';

// Delivery
import '../delivery/send-message.js';
import '../delivery/stores.js';

// Payment
import '../payment/invoice-prepaid.js';
import '../payment/paypal-checkout.js';
import { configureAppleTransactionsModule } from '../payment/apple-iap/index.js';
import { configureSaferpayTransactionsModule } from '../payment/saferpay/index.js';

// Filter & Search
import '../filters/strict-equal.js';
import '../filters/local-search.js';

// Workers
import '../worker/sms.js';
import '../worker/push-notification.js';
import '../worker/enrollment-order-generator.js';

// import { configureGenerateOrderAutoscheduling } from '../worker/enrollment-order-generator.js';

const modules: Record<
  string,
  {
    configure: (params: ModuleInput<any>) => any;
  }
> = {
  ...baseModules,
  ...cryptoModules,
  appleTransactions: {
    configure: configureAppleTransactionsModule,
  },
  saferpayTransactions: {
    configure: configureSaferpayTransactionsModule,
  },
};

export default modules;
