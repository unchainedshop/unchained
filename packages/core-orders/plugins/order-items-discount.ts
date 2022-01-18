import {
  IOrderPricingAdapter,
  OrderPricingRowCategory,
} from '@unchainedshop/types/orders.pricing';
import {
  OrderPricingDirector,
  OrderPricingAdapter,
} from 'meteor/unchained:core-orders';

const resolveRatioAndTaxDivisorForPricingSheet = (pricing, total) => {
  if (total === 0 || !pricing) {
    return {
      ratio: 1,
      taxDivisor: 1,
    };
  }
  const tax = pricing.taxSum();
  const gross = pricing.gross();
  return {
    ratio: gross / total,
    taxDivisor: gross / (gross - tax),
  };
};

const resolveAmountAndTax = ({ ratio, taxDivisor }, amount) => {
  const shareAmount = Number.isFinite(ratio) ? amount * ratio : 0;
  const shareTaxAmount = Number.isFinite(taxDivisor)
    ? shareAmount - shareAmount / taxDivisor
    : 0;
  return [shareAmount, shareTaxAmount];
};

const applyDiscountToMultipleShares = (shares, amount) => {
  return shares.reduce(
    ([currentDiscountAmount, currentTaxAmount], share) => {
      const [shareAmount, shareTaxAmount] = resolveAmountAndTax(share, amount);
      return [
        currentDiscountAmount + shareAmount,
        currentTaxAmount + shareTaxAmount,
      ];
    },
    [0, 0]
  );
};

const calculateAmountToSplit = (configuration, amount) => {
  const deductionAmount = configuration.rate
    ? amount * configuration.rate
    : Math.min(configuration.fixedRate, amount);

  return Math.max(0, deductionAmount - (configuration.alreadyDeducted || 0));
};

const OrderItemsDiscount: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-items-discount',
  version: '1.0',
  label: 'Apply Discounts on Total Value Of Goods',
  orderIndex: 89,

  isActivatedFor: async () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    return {
      ...pricingAdapter,

      calculate: async () => {
        // discounts need to provide a *fixedRate*
        // if you want to add percentual discounts,
        // add it to the order item calculation

        const totalAmountOfItems = pricingAdapter.calculationSheet.sum({
          category: OrderPricingRowCategory.Items,
        });

        const itemShares = params.context.orderPositions.map((item) =>
          resolveRatioAndTaxDivisorForPricingSheet(
            // TODO: use modules
            // this.context.modules.orders.orderPosition.pricing(item),
            /* @ts-ignore */
            item.pricing(),
            totalAmountOfItems
          )
        );

        let alreadyDeducted = 0;

        params.discounts.forEach(({ configuration, discountId }) => {
          // First, we deduce the discount from the items
          const [itemsDiscountAmount, itemsTaxAmount] =
            applyDiscountToMultipleShares(
              itemShares,
              calculateAmountToSplit(
                { ...configuration, alreadyDeducted },
                totalAmountOfItems
              )
            );
          alreadyDeducted = +itemsDiscountAmount;

          const discountAmount = itemsDiscountAmount;
          const taxAmount = itemsTaxAmount;
          if (discountAmount) {
            pricingAdapter.resultSheet().addDiscounts({
              amount: discountAmount * -1,
              discountId,
              meta: {
                adapter: OrderItemsDiscount.key,
              },
            });
            if (taxAmount !== 0) {
              pricingAdapter.resultSheet().addTaxes({
                amount: taxAmount * -1,
                meta: {
                  discountId,
                  adapter: OrderItemsDiscount.key,
                },
              });
            }
          }
        });

        return await pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderItemsDiscount);
