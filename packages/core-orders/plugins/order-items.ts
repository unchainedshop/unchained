import { IOrderPricingAdapter } from '@unchainedshop/types/orders.pricing';
import {
  OrderPricingDirector,
  OrderPricingAdapter,
} from 'meteor/unchained:core-orders';

const OrderItems: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-items',
  version: '1.0',
  label: 'Add Total Value Of Goods to Order',
  orderIndex: 0,

  isActivatedFor: async () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    return {
      ...pricingAdapter,

      calculate: async () => {
        // just sum up all products items prices, taxes & fees
        const totalAndTaxesOfAllItems = params.context.orderPositions.reduce(
          (current, orderPosition) => {
            // TODO: use module
            // @ts-ignore */
            const pricing = orderPosition.pricing();
            const tax = pricing.taxSum();
            const items = pricing.gross();
            return {
              taxes: current.taxes + tax,
              items: current.items + items,
            };
          },
          {
            taxes: 0,
            items: 0,
          }
        );

        pricingAdapter.resultSheet.addItems({
          amount: totalAndTaxesOfAllItems.items,
        });

        if (totalAndTaxesOfAllItems.taxes !== 0) {
          pricingAdapter.resultSheet.addTaxes({
            amount: totalAndTaxesOfAllItems.taxes,
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderItems);
