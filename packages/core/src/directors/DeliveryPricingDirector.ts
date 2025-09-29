import { DeliveryPricingSheet, BasePricingDirector, IPricingDirector } from '../directors/index.js';

import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter,
  IDeliveryPricingSheet,
} from './DeliveryPricingAdapter.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';

import type { Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import type { OrderDelivery } from '@unchainedshop/core-orders';

export type DeliveryPricingContext =
  | {
      currencyCode: string;
      countryCode?: string;
      provider: DeliveryProvider;
      providerContext?: any;
      order: Order;
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
