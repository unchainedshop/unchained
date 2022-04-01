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

  buildPricingContext: async ({ order, ...context }: { order: Order }, requestContext) => {
    const { modules } = requestContext;
    const user = await modules.users.findUserById(order.userId);

    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: order._id,
    });

    return {
      country: order.countryCode,
      currency: order.currency,
      ...context,
      ...requestContext,
      discounts,
      order,
      user,
    };
  },

  async actions(pricingContext, requestContext) {
    const actions = await baseDirector.actions(pricingContext, requestContext, this.buildPricingContext);
    return {
      ...actions,
      resultSheet() {
        const calculation = actions.getCalculation();
        const context = actions.getContext();
        return OrderPricingSheet({
          calculation,
          currency: context.currency,
        });
      },
    };
  },
};
