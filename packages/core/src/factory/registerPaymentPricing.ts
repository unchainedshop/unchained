import {
  PaymentPricingAdapter,
  type IPlugin,
  type IPaymentPricingAdapter,
  type IPaymentPricingSheet,
  type PaymentPricingAdapterContext,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerPaymentPricing({
  adapterId,
  orderIndex,
  isActivatedFor,
  calculate,
}: {
  adapterId: string;
  orderIndex?: number;
  isActivatedFor?: (context: PaymentPricingAdapterContext) => boolean;
  calculate: (sheet: IPaymentPricingSheet, context: PaymentPricingAdapterContext) => Promise<void>;
}): IPlugin {
  const adapter: IPaymentPricingAdapter = {
    ...PaymentPricingAdapter,

    key: `shop.unchained.pricing.payment-${adapterId}`,
    label: 'Payment Pricing: ' + adapterId,
    version: '1.0.0',
    orderIndex: orderIndex ?? 0,

    isActivatedFor: (context) => (isActivatedFor ? isActivatedFor(context) : true),

    actions: (params) => {
      const pricingAdapter = PaymentPricingAdapter.actions(params);
      return {
        ...pricingAdapter,
        calculate: async () => {
          await calculate(pricingAdapter.resultSheet(), params.context);
          return pricingAdapter.calculate();
        },
      };
    },
  };

  const plugin: IPlugin = {
    key: adapter.key,
    label: adapter.label,
    version: adapter.version,
    adapters: [adapter],
  };

  pluginRegistry.register(plugin);
  return plugin;
}
