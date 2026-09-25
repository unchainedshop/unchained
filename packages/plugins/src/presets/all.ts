// All preset: base + crypto + Swiss tax presets plus the remaining payment, delivery, filter and
// worker plugins. Needs the optional crypto peers (@scure/*, @noble/*). Not included: MinIO, the
// 100-off and half-price-manual discounts, the EU/UK/US tax presets and the Redis/EventBridge emitters.

// Import base and crypto presets
import { registerBasePlugins } from './base.ts';
import { registerCryptoPlugins } from './crypto.ts';

// Import country-specific plugins
import { registerSwissTaxPlugins } from './countries/ch.ts';

// Import PluginRegistry
import { pluginRegistry } from '@unchainedshop/core';

// Import payment and delivery plugins
import { DatatransPlugin } from '../payment/datatrans-v2/index.ts';
import { StripePlugin } from '../payment/stripe/index.ts';
import { InvoicePrepaidPlugin } from '../payment/invoice-prepaid/index.ts';
import { SendMessagePlugin } from '../delivery/send-message/index.ts';
import { PickMupPlugin } from '../delivery/stores/index.ts';
import { AppleIAPPlugin } from '../payment/apple-iap/index.ts';
import { PayrexxPlugin } from '../payment/payrexx/index.ts';
import { PostfinanceCheckoutPlugin } from '../payment/postfinance-checkout/index.ts';
import { SaferpayPlugin } from '../payment/saferpay/index.ts';

// Import filter plugins
import { StrictQualFilterPlugin } from '../filters/strict-equal/index.ts';
import { LocalSearchPlugin } from '../filters/local-search/index.ts';

// Import worker plugins
import { TwilioPlugin } from '../worker/twilio/index.ts';
import { BulkGatePlugin } from '../worker/bulkgate/index.ts';
import { BudgetSMSPlugin } from '../worker/budgetsms/index.ts';
import { PushNotificationPlugin } from '../worker/push-notification/index.ts';
import { EnrollmentOrderGeneratorPlugin } from '../worker/enrollment-order-generator/index.ts';

export function registerAllPlugins() {
  // Register base plugins
  registerBasePlugins();

  // Register crypto plugins
  registerCryptoPlugins();

  // Register Swiss tax plugins
  registerSwissTaxPlugins();

  // Payment & delivery
  pluginRegistry.register(DatatransPlugin);
  pluginRegistry.register(StripePlugin);
  pluginRegistry.register(AppleIAPPlugin);
  pluginRegistry.register(PayrexxPlugin);
  pluginRegistry.register(PostfinanceCheckoutPlugin);
  pluginRegistry.register(SaferpayPlugin);
  pluginRegistry.register(InvoicePrepaidPlugin);
  pluginRegistry.register(SendMessagePlugin);
  pluginRegistry.register(PickMupPlugin);

  // Filters
  pluginRegistry.register(StrictQualFilterPlugin);
  pluginRegistry.register(LocalSearchPlugin);

  // Workers
  pluginRegistry.register(TwilioPlugin);
  pluginRegistry.register(BulkGatePlugin);
  pluginRegistry.register(BudgetSMSPlugin);
  pluginRegistry.register(PushNotificationPlugin);
  pluginRegistry.register(EnrollmentOrderGeneratorPlugin);
}
