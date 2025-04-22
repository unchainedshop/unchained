import {
  IOrderPricingAdapter,
  OrderPricingDirector,
  OrderPricingAdapter,
  ProductPricingSheet,
} from '@unchainedshop/core';

const OrderItems: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-items',
  version: '1.0.0',
  label: 'Add Total Value Of Goods to Order',
  orderIndex: 0,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    const { order, orderPositions } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // just sum up all products items prices, taxes & fees
        const totalAndTaxesOfAllItems = orderPositions.reduce(
          (current, orderPosition) => {
            const pricing = ProductPricingSheet({
              calculation: orderPosition.calculation,
              currencyCode: order.currencyCode,
              quantity: orderPosition.quantity,
            });
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
          },
        );

        pricingAdapter.resultSheet().addItems({
          amount: totalAndTaxesOfAllItems.items,
          taxAmount: totalAndTaxesOfAllItems.taxes,
          meta: { adapter: OrderItems.key },
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderItems);
