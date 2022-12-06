import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  DeliveryPricingContext,
  IDeliveryPricingAdapter,
  IDeliveryPricingDirector,
} from '@unchainedshop/types/delivery.pricing';
import { BasePricingDirector } from '@unchainedshop/utils';
import { DeliveryPricingSheet } from './DeliveryPricingSheet';

const baseDirector = BasePricingDirector<
  DeliveryPricingContext,
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter
>('DeliveryPricingDirector');

export const DeliveryPricingDirector: IDeliveryPricingDirector = {
  ...baseDirector,

  async buildPricingContext({ item, ...context }, unchainedAPI) {
    const { modules } = unchainedAPI;

    if (!item)
      return {
        discounts: [],
        ...context,
        ...unchainedAPI,
      };

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
      country: order.countryCode,
      currency: order.currency,
      ...context,
      ...unchainedAPI,
      order,
      orderDelivery: item,
      provider,
      user,
      discounts,
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
