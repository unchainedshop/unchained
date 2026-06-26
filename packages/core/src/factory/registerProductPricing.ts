import {
  ProductPricingAdapter,
  type IPlugin,
  type IProductPricingAdapter,
  type IProductPricingSheet,
  type ProductPricingAdapterContext,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerProductPricing({
  adapterId,
  orderIndex,
  isActivatedFor,
  calculate,
}: {
  adapterId: string;
  orderIndex?: number;
  isActivatedFor?: (context: ProductPricingAdapterContext) => boolean;
  calculate: (sheet: IProductPricingSheet, context: ProductPricingAdapterContext) => Promise<void>;
}): IPlugin {
  const adapter: IProductPricingAdapter = {
    ...ProductPricingAdapter,

    key: `shop.unchained.pricing.product-${adapterId}`,
    label: 'Product Pricing: ' + adapterId,
    version: '1.0.0',
    orderIndex: orderIndex ?? 0,

    isActivatedFor: (context) => (isActivatedFor ? isActivatedFor(context) : true),

    actions: (params) => {
      const pricingAdapter = ProductPricingAdapter.actions(params);
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
