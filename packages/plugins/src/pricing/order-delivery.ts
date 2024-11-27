import { UnchainedCore } from '@unchainedshop/core';
import { IOrderPricingAdapter } from '@unchainedshop/core-orders';
import { OrderPricingDirector, OrderPricingAdapter } from '@unchainedshop/core-orders';

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
    const { order, orderDelivery, modules } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // just add tax + net price to order pricing
        if (!orderDelivery) return null;
        const pricing = modules.orders.deliveries.pricingSheet(orderDelivery, order.currency);
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
