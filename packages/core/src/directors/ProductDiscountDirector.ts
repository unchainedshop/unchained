import { BaseDiscountDirector } from './BaseDiscountDirector.ts';
import type { ProductDiscountConfiguration } from './ProductDiscountConfiguration.ts';
import { ProductDiscountAdapter } from './ProductDiscountAdapter.ts';
import type { IDiscountAdapter } from './BaseDiscountAdapter.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
const baseDirector = BaseDiscountDirector<ProductDiscountConfiguration>('ProductDiscountDirector');

export const ProductDiscountDirector = {
  ...baseDirector,

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(
      ProductDiscountAdapter.adapterType!,
    ) as IDiscountAdapter<ProductDiscountConfiguration>[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: (options?: { adapterFilter?: (adapter: any) => boolean }) => {
    const adapters = pluginRegistry.getAdapters(
      ProductDiscountAdapter.adapterType!,
    ) as IDiscountAdapter<ProductDiscountConfiguration>[];
    return adapters.filter(options?.adapterFilter || (() => true));
  },
};
