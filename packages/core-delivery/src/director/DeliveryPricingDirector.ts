import { OrderDelivery } from '@unchainedshop/types/orders';
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
>();

export const DeliveryPricingDirector: IDeliveryPricingDirector = {
  ...baseDirector,

  buildPricingContext(
    {
      item,
      ...rest
    }: {
      item: OrderDelivery;
    },
    requestContext
  ) {
    const { providerContext, ...context } = rest as any;

    if (!item)
      return {
        discounts: [],
        providerContext,
        ...context,
      };

    // TODO: use modules
    /* @ts-ignore */
    const order = item.order();
    /* @ts-ignore */
    const provider = item.provider();
    const user = order.user();
    const discounts = order.discounts();

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

  resultSheet: () => {
    const calculation = baseDirector.getCalculation();
    const context = baseDirector.getContext();

    return DeliveryPricingSheet({
      calculation,
      currency: context.currency,
      quantity: context.quantity,
    });
  },
};
