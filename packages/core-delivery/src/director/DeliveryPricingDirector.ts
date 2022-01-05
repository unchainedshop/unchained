import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  DeliveryPricingContext,
  IDeliveryPricingAdapter,
  IDeliveryPricingDirector,
} from '@unchainedshop/types/delivery.pricing';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { BasePricingDirector } from 'meteor/unchained:utils';

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
    const { modules } = requestContext;
    const { providerContext, ...context } = rest as any;

    if (!item)
      return {
        discounts: [],
        providerContext,
        ...context,
      };

    const order = await modules.orders.findOrder({
      orderId: item.orderId,
    });
    const provider = modules.delivery.findProvider({
      deliveryProviderId: item.deliveryProviderId,
    });
    const user = await modules.users.findUser({
      userId: order.userId,
    });

    const discounts = await modules.orders.discounts.findOrderDiscount({
      discountId: item.orderId,
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
