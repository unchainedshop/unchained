import { UnchainedCore, ProductPricingSheet } from '@unchainedshop/core';
import {
  OrderPricingDirector,
  OrderPricingAdapter,
  OrderDiscountConfiguration,
  IOrderPricingAdapter,
  OrderPricingRowCategory,
} from '@unchainedshop/core-orders';
import { calculation as calcUtils } from '@unchainedshop/utils';

const OrderItemsDiscount: IOrderPricingAdapter<UnchainedCore, OrderDiscountConfiguration> = {
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
    const { order, orderPositions } = params.context;

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
            ProductPricingSheet({
              calculation: orderPosition.calculation,
              currency: order.currency,
              quantity: orderPosition.quantity,
            }),
            totalAmountOfItems,
          ),
        );

        let amountLeft = totalAmountOfItems;

        params.discounts.forEach(({ configuration, discountId }) => {
          // First, we deduce the discount from the items
          const leftInItemsToSplit = calcUtils.calculateAmountToSplit(
            { ...configuration },
            totalAmountOfItems,
          );
          const [itemsDiscountAmount, itemsTaxAmount] = calcUtils.applyDiscountToMultipleShares(
            itemShares,
            Math.max(0, Math.min(amountLeft, leftInItemsToSplit)),
          );
          amountLeft -= itemsDiscountAmount;

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
