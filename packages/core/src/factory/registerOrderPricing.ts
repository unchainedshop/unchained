import {
  OrderPricingAdapter,
  type IPlugin,
  type IOrderPricingAdapter,
  type IOrderPricingSheet,
  type OrderPricingAdapterContext,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerOrderPricing({
  adapterId,
  orderIndex,
  isActivatedFor,
  calculate,
}: {
  adapterId: string;
  orderIndex?: number;
  isActivatedFor?: (context: OrderPricingAdapterContext) => boolean;
  calculate: (sheet: IOrderPricingSheet, context: OrderPricingAdapterContext) => Promise<void>;
}): IPlugin {
  const adapter: IOrderPricingAdapter = {
    ...OrderPricingAdapter,

    key: `shop.unchained.pricing.order-${adapterId}`,
    label: 'Order Pricing: ' + adapterId,
    version: '1.0.0',
    orderIndex: orderIndex ?? 0,

    isActivatedFor: (context) => (isActivatedFor ? isActivatedFor(context) : true),

    actions: (params) => {
      const pricingAdapter = OrderPricingAdapter.actions(params);
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
