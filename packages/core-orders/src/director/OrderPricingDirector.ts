import {
  IOrderPricingAdapter,
  IOrderPricingDirector,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  OrderPricingContext,
} from '@unchainedshop/types/orders.pricing';
import { BasePricingDirector } from '@unchainedshop/utils';
import { OrderPricingSheet } from './OrderPricingSheet';

const baseDirector = BasePricingDirector<
  OrderPricingContext,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingAdapter
>('OrderPricingDirector');

export const OrderPricingDirector: IOrderPricingDirector = {
  ...baseDirector,

  buildPricingContext: async ({ order, ...context }, unchainedAPI) => {
    const { modules } = unchainedAPI;
    const user = await modules.users.findUserById(order.userId);

    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });

    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });

    const orderPositions = await modules.orders.positions.findOrderPositions({
      orderId: order._id,
    });

    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: order._id,
    });

    return {
      country: order.countryCode,
      currency: order.currency,
      ...context,
      ...unchainedAPI,
      discounts,
      order,
      orderDelivery,
      orderPayment,
      orderPositions,
      user,
    };
  },

  async actions(pricingContext, unchainedAPI) {
    const actions = await baseDirector.actions(pricingContext, unchainedAPI, this.buildPricingContext);
    return {
      ...actions,
      calculationSheet() {
        const context = actions.getContext();
        return OrderPricingSheet({
          calculation: actions.getCalculation(),
          currency: context.currency,
        });
      },
    };
  },
};
