import { Order } from '@unchainedshop/types/orders';
import {
  IOrderPricingAdapter,
  IOrderPricingDirector,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  OrderPricingContext,
} from '@unchainedshop/types/orders.pricing';
import { BasePricingDirector } from 'meteor/unchained:utils';
import { OrderPricingSheet } from './OrderPricingSheet';

const baseDirector = BasePricingDirector<
  OrderPricingContext,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingAdapter
>('OrderPricingDirector');

export const OrderPricingDirector: IOrderPricingDirector = {
  ...baseDirector,

  buildPricingContext: async ({ order }: { order: Order }, requestContext) => {
    const user = await requestContext.modules.users.findUser({
      userId: order.userId,
    });

    // TODO: use modules
    /* @ts-ignore */
    const orderPositions = order.items();
    // TODO: use modules
    /* @ts-ignore */
    const orderDelivery = order.delivery();
    // TODO: use modules
    /* @ts-ignore */
    const orderPayment = order.payment();
    // TODO: use modules
    /* @ts-ignore */
    const discounts = order.discounts();

    return {
      currency: order.currency,
      discounts,
      order,
      orderDelivery,
      orderPositions,
      orderPayment,
      user,
      ...requestContext,
    };
  },

  resultSheet() {
    const pricingSheet = OrderPricingSheet({
      calculation: baseDirector.getCalculation(),
      currency: baseDirector.getContext().order.currency,
    });

    return pricingSheet;
  },
};
