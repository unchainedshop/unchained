import { BaseDiscountDirector } from './BaseDiscountDirector.ts';
import type { IDiscountAdapter } from './BaseDiscountAdapter.ts';
import type { OrderDiscountConfiguration } from './OrderDiscountConfiguration.ts';
import { OrderDiscountAdapter } from './OrderDiscountAdapter.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
const baseDirector = BaseDiscountDirector<OrderDiscountConfiguration>('OrderDiscountDirector');

export const OrderDiscountDirector = {
  ...baseDirector,

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(
      OrderDiscountAdapter.adapterType!,
    ) as IDiscountAdapter<OrderDiscountConfiguration>[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: (options?: { adapterFilter?: (adapter: any) => boolean }) => {
    const adapters = pluginRegistry.getAdapters(
      OrderDiscountAdapter.adapterType!,
    ) as IDiscountAdapter<OrderDiscountConfiguration>[];
    return adapters.filter(options?.adapterFilter || (() => true));
  },
};
