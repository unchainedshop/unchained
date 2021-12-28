import { Order, OrderDelivery } from '@unchainedshop/types/orders';
import {
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  OrderPricingContext,
  IOrderPricingAdapter,
  IOrderPricingDirector,
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

  buildPricingContext: ({ order }: { order: Order }, requestContext) => {
    // TODO: use modules
    /* @ts-ignore */
    const user = order.user();
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
