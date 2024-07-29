import { BasePricingDirector } from '@unchainedshop/utils';
import { DeliveryPricingSheet } from './DeliveryPricingSheet.js';
import { DeliveryProvider } from '../types.js';
import { Order } from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';
import { OrderDelivery } from '@unchainedshop/core-orders';
import { IPricingDirector } from '@unchainedshop/utils';
import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter,
  IDeliveryPricingSheet,
} from './DeliveryPricingAdapter.js';

export type DeliveryPricingContext =
  | {
      country?: string;
      currency?: string;
      provider: DeliveryProvider;
      providerContext?: any;
      order: Order;
      user: User;
    }
  | { item: OrderDelivery };

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

export const DeliveryPricingDirector: IDeliveryPricingDirector = {
  ...baseDirector,

  async buildPricingContext(context, unchainedAPI) {
    const { modules } = unchainedAPI;

    if ('item' in context) {
      const { item } = context;
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
        currency: order.currency,
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

  async actions(pricingContext, unchainedAPI) {
    const actions = await baseDirector.actions(pricingContext, unchainedAPI, this.buildPricingContext);
    return {
      ...actions,
      calculationSheet() {
        const context = actions.getContext();
        return DeliveryPricingSheet({
          calculation: actions.getCalculation(),
          currency: context.currency,
        });
      },
    };
  },
};
