import type { PricingCalculation } from '@unchainedshop/utils';
import {
  OrderDiscountAdapter,
  type DiscountContext,
  type IDiscountAdapter,
  type IPricingSheet,
  type OrderDiscountConfiguration,
  type IPlugin,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerOrderDiscount({
  adapterId,
  isValidForSystemTriggering,
  isValidForCodeTriggering,
  discountForPricingAdapterKey,
  reserve,
  release,
}: {
  adapterId: string;
  isValidForSystemTriggering?: (context: DiscountContext) => Promise<boolean>;
  isValidForCodeTriggering?: (code: string, context: DiscountContext) => Promise<boolean>;
  discountForPricingAdapterKey: (
    params: { pricingAdapterKey: string; calculationSheet: IPricingSheet<PricingCalculation> },
    context: DiscountContext,
  ) => OrderDiscountConfiguration | null;
  reserve?: (code: string | undefined, context: DiscountContext) => Promise<any>;
  release?: (context: DiscountContext) => Promise<void>;
}): IPlugin {
  const adapter: IDiscountAdapter<OrderDiscountConfiguration> = {
    ...OrderDiscountAdapter,

    key: `shop.unchained.discount.order-${adapterId}`,
    label: 'Order Discount: ' + adapterId,
    version: '1.0.0',

    actions: async ({ context }) => {
      return {
        ...(await OrderDiscountAdapter.actions({ context })),

        isValidForSystemTriggering: async () => {
          return isValidForSystemTriggering ? isValidForSystemTriggering(context) : false;
        },

        isValidForCodeTriggering: async ({ code }) => {
          return isValidForCodeTriggering ? isValidForCodeTriggering(code, context) : false;
        },

        discountForPricingAdapterKey: (params) => {
          return discountForPricingAdapterKey(params, context);
        },

        reserve: async ({ code }) => {
          return reserve ? reserve(code, context) : {};
        },

        release: async () => {
          if (release) await release(context);
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
