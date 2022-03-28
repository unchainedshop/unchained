import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  DeliveryPricingContext,
  IDeliveryPricingAdapter,
  IDeliveryPricingDirector,
} from '@unchainedshop/types/delivery.pricing';
import { BasePricingDirector } from 'meteor/unchained:utils';
import { DeliveryPricingSheet } from './DeliveryPricingSheet';

const baseDirector = BasePricingDirector<
  DeliveryPricingContext,
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter
>('DeliveryPricingDirector');

export const DeliveryPricingDirector: IDeliveryPricingDirector = {
  ...baseDirector,

  async buildPricingContext({ item, ...context }, requestContext) {
    const { modules } = requestContext;

    if (!item)
      return {
        discounts: [],
        ...context,
        ...requestContext,
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
      ...requestContext,
      order,
      orderDelivery: item,
      provider,
      user,
      discounts,
    };
  },

  async actions(pricingContext, requestContext) {
    const actions = await baseDirector.actions(pricingContext, requestContext, this.buildPricingContext);
    return {
      ...actions,
      resultSheet() {
        const calculation = actions.getCalculation();
        const context = actions.getContext();

        return DeliveryPricingSheet({
          calculation,
          currency: context.currency,
        });
      },
    };
  },
};
