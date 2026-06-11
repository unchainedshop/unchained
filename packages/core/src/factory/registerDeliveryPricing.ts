import {
  DeliveryPricingAdapter,
  type IPlugin,
  type IDeliveryPricingAdapter,
  type IDeliveryPricingSheet,
  type DeliveryPricingAdapterContext,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerDeliveryPricing({
  adapterId,
  orderIndex,
  isActivatedFor,
  calculate,
}: {
  adapterId: string;
  orderIndex?: number;
  isActivatedFor?: (context: DeliveryPricingAdapterContext) => boolean;
  calculate: (sheet: IDeliveryPricingSheet, context: DeliveryPricingAdapterContext) => Promise<void>;
}): IPlugin {
  const adapter: IDeliveryPricingAdapter = {
    ...DeliveryPricingAdapter,

    key: `shop.unchained.pricing.delivery-${adapterId}`,
    label: 'Delivery Pricing: ' + adapterId,
    version: '1.0.0',
    orderIndex: orderIndex ?? 0,

    isActivatedFor: (context) => (isActivatedFor ? isActivatedFor(context) : true),

    actions: (params) => {
      const pricingAdapter = DeliveryPricingAdapter.actions(params);
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
