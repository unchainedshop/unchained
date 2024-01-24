import { IOrderPricingAdapter, OrderPricingRowCategory } from '@unchainedshop/types/orders.pricing.js';
import { OrderPricingDirector, OrderPricingAdapter } from '@unchainedshop/core-orders';
import { calculation as calcUtils } from '@unchainedshop/utils';

const OrderItemsDiscount: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-items-discount',
  version: '1.0.0',
  label: 'Apply Discounts on Total Value Of Goods',
  orderIndex: 30,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    const { order, orderPositions, modules } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // discounts need to provide a *fixedRate*
        // if you want to add percentual discounts,
        // add it to the order item calculation

        const totalAmountOfItems = params.calculationSheet.total({
          category: OrderPricingRowCategory.Items,
          useNetPrice: false,
        }).amount;

        const itemShares = orderPositions.map((orderPosition) =>
          calcUtils.resolveRatioAndTaxDivisorForPricingSheet(
            modules.orders.positions.pricingSheet(orderPosition, order.currency, params.context),
            totalAmountOfItems,
          ),
        );

        let alreadyDeducted = 0;

        params.discounts.forEach(({ configuration, discountId }) => {
          // First, we deduce the discount from the items
          const [itemsDiscountAmount, itemsTaxAmount] = calcUtils.applyDiscountToMultipleShares(
            itemShares,
            calcUtils.calculateAmountToSplit({ ...configuration, alreadyDeducted }, totalAmountOfItems),
          );
          alreadyDeducted = +itemsDiscountAmount;

          const discountAmount = itemsDiscountAmount * -1;
          const taxAmount = itemsTaxAmount * -1;
          if (discountAmount) {
            pricingAdapter.resultSheet().addDiscount({
              amount: discountAmount,
              taxAmount,
              discountId,
              meta: {
                adapter: OrderItemsDiscount.key,
              },
            });
          }
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderItemsDiscount);
