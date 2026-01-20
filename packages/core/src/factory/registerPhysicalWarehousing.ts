import type { WarehousingConfiguration } from '@unchainedshop/core-warehousing';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import {
  WarehousingAdapter,
  type WarehousingContext,
  type IPlugin,
  type IWarehousingAdapter,
} from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerPhysicalWarehousing({
  adapterId,
  orderIndex = 0,
  stock,
  productionTime,
  commissioningTime,
}: {
  adapterId: string;
  orderIndex?: number;
  stock?:
    | number
    | ((
        referenceDate: Date,
        configuration: WarehousingConfiguration,
        context: WarehousingContext,
      ) => Promise<number>);

  productionTime?:
    | number
    | ((
        quantityToProduct: number,
        configuration: WarehousingConfiguration,
        context: WarehousingContext,
      ) => Promise<number>);

  commissioningTime?:
    | number
    | ((
        quantity: number,
        configuration: WarehousingConfiguration,
        context: WarehousingContext,
      ) => Promise<number>);
}): IPlugin {
  const adapter: IWarehousingAdapter = {
    ...WarehousingAdapter,

    key: 'shop.unchained.warehousing.physical.' + adapterId,
    label: 'Physical Warehousing: ' + adapterId,
    version: '1.0.0',
    orderIndex,

    initialConfiguration: [{ key: 'shipping-hub', value: 'Shipping Hub' }],

    typeSupported: (type) => {
      return type === WarehousingProviderType.PHYSICAL;
    },

    actions: (configuration, context) => {
      return {
        ...WarehousingAdapter.actions(configuration, context),

        isActive() {
          return true;
        },

        configurationError() {
          return null;
        },

        stock: async (referenceDate) => {
          if (typeof stock === 'number') {
            return stock;
          } else if (typeof stock === 'function') {
            return stock(referenceDate, configuration, context);
          }
          return 99999;
        },

        productionTime: async (quantityToProduct: number) => {
          if (typeof productionTime === 'number') {
            return productionTime;
          } else if (typeof productionTime === 'function') {
            return productionTime(quantityToProduct, configuration, context);
          }
          return 0;
        },

        commissioningTime: async (quantity: number) => {
          if (typeof commissioningTime === 'number') {
            return commissioningTime;
          } else if (typeof commissioningTime === 'function') {
            return commissioningTime(quantity, configuration, context);
          }
          return 0;
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
