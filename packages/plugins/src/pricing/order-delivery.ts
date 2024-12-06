import { UnchainedCore, DeliveryPricingSheet } from '@unchainedshop/core';
import {
  IOrderPricingAdapter,
  OrderPricingDirector,
  OrderPricingAdapter,
} from '@unchainedshop/core-orders';

export const OrderDelivery: IOrderPricingAdapter<UnchainedCore> = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-delivery',
  version: '1.0.0',
  label: 'Add Delivery Fees to Order',
  orderIndex: 10,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    const { order, orderDelivery } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // just add tax + net price to order pricing
        if (!orderDelivery) return null;
        const pricing = DeliveryPricingSheet({
          calculation: orderDelivery.calculation,
          currency: order.currency,
        });
        const tax = pricing.taxSum();
        const shipping = pricing.gross();

        pricingAdapter
          .resultSheet()
          .addDelivery({ amount: shipping, taxAmount: tax, meta: { adapter: OrderDelivery.key } });

        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderDelivery);
