import { IOrderPricingAdapter } from '@unchainedshop/types/orders.pricing';
import {
  OrderPricingDirector,
  OrderPricingAdapter,
} from 'meteor/unchained:core-orders';

const OrderPayment: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-payment',
  version: '1.0',
  label: 'Add Payment Fees to Order',
  orderIndex: 20,

  isActivatedFor: async () => {
    return true;
  },
  
  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    return {
      ...pricingAdapter,

      calculate: async () => {
        // just add tax + net price to order pricing
        const { orderPayment } = params.context;

        if (orderPayment) {
          // TODO: use module
          // @ts-ignore */
          const pricing = orderPayment.pricing();
          const tax = pricing.taxSum();
          const paymentFees = pricing.gross();

          pricingAdapter.resultSheet().addPayment({ amount: paymentFees });
          if (tax !== 0) {
            pricingAdapter.resultSheet().addTaxes({ amount: tax });
          }
        }

        return await pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderPayment);
