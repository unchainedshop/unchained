import { BasePricingDirector } from '@unchainedshop/utils';
import { DeliveryPricingSheet } from './DeliveryPricingSheet.js';
import { IPricingDirector } from '@unchainedshop/utils';
import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter,
  IDeliveryPricingSheet,
} from './DeliveryPricingAdapter.js';
import { DeliveryProvider } from '../db/DeliveryProvidersCollection.js';

import type { Order } from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import type { OrderDelivery } from '@unchainedshop/core-orders';

export type DeliveryPricingContext =
  | {
      currency: string;
      country?: string;
      provider: DeliveryProvider;
      providerContext?: any;
      order: Order;
      user: User;
    }
  | { currency: string; item: OrderDelivery };

export type IDeliveryPricingDirector<
  UnchainedAPI = unknown,
  DiscountConfiguration = unknown,
> = IPricingDirector<
  DeliveryPricingContext,
  DeliveryPricingCalculation,
  DeliveryPricingAdapterContext,
  IDeliveryPricingSheet,
  IDeliveryPricingAdapter<UnchainedAPI, DiscountConfiguration>,
  UnchainedAPI
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
      const { item, currency } = context;
      const order = await modules.orders.findOrder({
        orderId: item.orderId,
      });
      const provider = await modules.delivery.findProvider({
        deliveryProviderId: item.deliveryProviderId,
      });
      const user = await modules.users.findUserById(order.userId);
      const discounts = await modules.orders.discounts.findOrderDiscounts({
        orderId: item.orderId,
      });

      return {
        ...unchainedAPI,
        country: order.countryCode,
        currency,
        order,
        provider,
        user,
        discounts,
        orderDelivery: item,
        providerContext: null,
      };
    }

    return {
      ...unchainedAPI,
      country: context.country,
      currency: context.currency,
      order: context.order,
      provider: context.provider,
      user: context.user,
      discounts: [],
      orderDelivery: null,
      providerContext: context.providerContext,
    };
  },

  calculationSheet(pricingContext, calculation) {
    return DeliveryPricingSheet({
      calculation,
      currency: pricingContext.currency,
    });
  },
};
