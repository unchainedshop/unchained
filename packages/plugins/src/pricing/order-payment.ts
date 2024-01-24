import { IOrderPricingAdapter } from '@unchainedshop/types/orders.pricing.js';
import { OrderPricingDirector, OrderPricingAdapter } from '@unchainedshop/core-orders';

const OrderPayment: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-payment',
  version: '1.0.0',
  label: 'Add Payment Fees to Order',
  orderIndex: 10,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    const { order, orderPayment, modules } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // just add tax + net price to order pricing
        if (!orderPayment) return null;

        const pricing = modules.orders.payments.pricingSheet(
          orderPayment,
          order.currency,
          params.context,
        );
        const tax = pricing.taxSum();
        const paymentFees = pricing.gross();

        pricingAdapter
          .resultSheet()
          .addPayment({ amount: paymentFees, taxAmount: tax, meta: { adapter: OrderPayment.key } });

        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderPayment);
