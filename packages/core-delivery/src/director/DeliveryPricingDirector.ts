import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
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

  buildPricingContext: async (
    {
      item,
      ...rest
    }: {
      item: OrderDelivery;
    },
    requestContext
  ) => {
    const { providerContext, ...context } = rest as any;

    if (!item)
      return {
        discounts: [],
        providerContext,
        ...context,
      };

    const order = await requestContext.modules.orders.findOrder({
      orderId: item.orderId,
    });
    const provider = requestContext.modules.delivery.findProvider({
      deliveryProviderId: item.deliveryProviderId,
    });
    const user = await requestContext.modules.users.findUser({
      userId: order.userId,
    });

    const discounts =
      await requestContext.modules.orders.discount.findOrderDiscount({
        orderDiscountId: item.orderId,
      });

    return {
      country: order.countryCode,
      currency: order.currency,
      discounts,
      order,
      provider,
      user,
      ...item.context,
      ...context,
      ...requestContext,
    };
  },

  actions: (pricingContext, requestContext) => {
    return {
      ...baseDirector.actions(pricingContext, requestContext),
    };
  },
};
