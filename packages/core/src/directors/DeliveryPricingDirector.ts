import { DeliveryPricingSheet } from './DeliveryPricingSheet.ts';
import { BasePricingDirector, type IPricingDirector } from './BasePricingDirector.ts';

import {
  type DeliveryPricingAdapterContext,
  type DeliveryPricingCalculation,
  type IDeliveryPricingAdapter,
  type IDeliveryPricingSheet,
  DeliveryPricingAdapter,
} from './DeliveryPricingAdapter.ts';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';

import type { Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import type { OrderDelivery } from '@unchainedshop/core-orders';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
export type DeliveryPricingContext =
  | {
      currencyCode: string;
      countryCode?: string;
      provider: DeliveryProvider;
      providerContext?: any;
      order?: Order;
      user: User;
    }
  | { currencyCode: string; item: OrderDelivery };

export type IDeliveryPricingDirector<DiscountConfiguration = unknown> = IPricingDirector<
  DeliveryPricingContext,
  DeliveryPricingCalculation,
  DeliveryPricingAdapterContext,
  IDeliveryPricingSheet,
  IDeliveryPricingAdapter<DiscountConfiguration>
>;

const baseDirector = BasePricingDirector<
  DeliveryPricingContext,
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter
>('DeliveryPricingDirector');

export const DeliveryPricingDirector: IDeliveryPricingDirector<any> = {
  ...baseDirector,

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(
      DeliveryPricingAdapter.adapterType!,
    ) as IDeliveryPricingAdapter[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: ({ adapterFilter } = {}) => {
    const adapters = pluginRegistry.getAdapters(
      DeliveryPricingAdapter.adapterType!,
    ) as IDeliveryPricingAdapter[];
    return adapters.filter(adapterFilter || (() => true));
  },

  async buildPricingContext(context, unchainedAPI) {
    const { modules } = unchainedAPI;

    if ('item' in context) {
      const { item, currencyCode } = context;
      const order = await modules.orders.findOrder({
        orderId: item.orderId,
      });
      const provider = await modules.delivery.findProvider({
        deliveryProviderId: item.deliveryProviderId,
      });
      const user = await modules.users.findUserById(order!.userId);
      const discounts = await modules.orders.discounts.findOrderDiscounts({
        orderId: item.orderId,
      });

      return {
        ...unchainedAPI,
        countryCode: order!.countryCode,
        currencyCode,
        order: order!,
        provider: provider!,
        user: user!,
        discounts,
        orderDelivery: item,
        providerContext: null,
      };
    }

    return {
      ...unchainedAPI,
      countryCode: context.countryCode,
      currencyCode: context.currencyCode,
      order: context.order,
      provider: context.provider,
      user: context.user,
      discounts: [],
      providerContext: context.providerContext,
    };
  },

  calculationSheet(pricingContext, calculation) {
    return DeliveryPricingSheet({
      calculation,
      currencyCode: pricingContext.currencyCode,
    });
  },
};
