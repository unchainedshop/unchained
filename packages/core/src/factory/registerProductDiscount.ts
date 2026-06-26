import {
  ProductDiscountAdapter,
  type IPlugin,
  type IDiscountAdapter,
  type IPricingSheet,
  type ProductDiscountConfiguration,
} from '../core-index.ts';
import type { PricingCalculation } from '@unchainedshop/utils';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerProductDiscount({
  adapterId,
  orderIndex,
  isManualAdditionAllowed,
  isManualRemovalAllowed,
  isValidForSystemTriggering,
  isValidForCodeTriggering,
  discountForPricingAdapterKey,
  reserve,
  release,
}: {
  adapterId: string;
  orderIndex?: number;
  isManualAdditionAllowed?: (code?: string) => Promise<boolean>;
  isManualRemovalAllowed?: () => Promise<boolean>;
  isValidForSystemTriggering?: () => Promise<boolean>;
  isValidForCodeTriggering?: (params: { code: string }) => Promise<boolean>;
  discountForPricingAdapterKey: (params: {
    pricingAdapterKey: string;
    calculationSheet: IPricingSheet<PricingCalculation>;
  }) => ProductDiscountConfiguration | null;
  reserve?: (params: { code?: string }) => Promise<any>;
  release?: () => Promise<void>;
}): IPlugin {
  const adapter: IDiscountAdapter<ProductDiscountConfiguration> = {
    ...ProductDiscountAdapter,

    key: `shop.unchained.discount.product-${adapterId}`,
    label: 'Product Discount: ' + adapterId,
    version: '1.0.0',
    orderIndex: orderIndex ?? 0,

    isManualAdditionAllowed: async (code) => {
      return isManualAdditionAllowed
        ? isManualAdditionAllowed(code)
        : ProductDiscountAdapter.isManualAdditionAllowed(code);
    },

    isManualRemovalAllowed: async () => {
      return isManualRemovalAllowed
        ? isManualRemovalAllowed()
        : ProductDiscountAdapter.isManualRemovalAllowed();
    },

    actions: async (params) => {
      return {
        ...(await ProductDiscountAdapter.actions(params)),

        isValidForSystemTriggering: async () => {
          return isValidForSystemTriggering ? isValidForSystemTriggering() : false;
        },

        isValidForCodeTriggering: async ({ code }) => {
          return isValidForCodeTriggering ? isValidForCodeTriggering({ code }) : false;
        },

        discountForPricingAdapterKey,

        reserve: async ({ code }) => {
          return reserve ? reserve({ code }) : {};
        },

        release: async () => {
          return release ? release() : undefined;
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
