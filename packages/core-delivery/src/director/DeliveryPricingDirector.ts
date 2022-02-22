import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  DeliveryPricingContext,
  IDeliveryPricingAdapter,
  IDeliveryPricingDirector,
} from '@unchainedshop/types/delivery.pricing';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
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

  async buildPricingContext(
    {
      item,
      ...rest
    }: {
      item: OrderDelivery;
    } & DeliveryPricingContext,
    requestContext,
  ) {
    const { modules } = requestContext;
    const { providerContext, currency, ...context } = rest as any;

    if (!item)
      return {
        discounts: [],
        providerContext,
        currency,
        ...context,
        ...requestContext,
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
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: item.orderId,
    });

    return {
      country: order.countryCode,
      currency: currency || order.currency,
      order,
      provider,
      user,
      discounts,
      ...item.context,
      ...context,
      ...requestContext,
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
