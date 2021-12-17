import {
  OrderPricingDirector,
  OrderPricingAdapter,
  OrderPricingSheetRowCategory,
} from 'meteor/unchained:director-pricing';

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

class ItemsDiscount extends OrderPricingAdapter {
  static key = 'shop.unchained.pricing.items-discount';

  static version = '1.0';

  static label = 'Apply Discounts on Total Value Of Goods';

  static orderIndex = 89;

  static async isActivatedFor() {
    return true;
  }

  async calculate() {
    // discounts need to provide a *fixedRate*
    // if you want to add percentual discounts,
    // add it to the order item calculation

    const totalAmountOfItems = this.calculation.sum({
      category: OrderPricingSheetRowCategory.Items,
    });

    const itemShares = this.context.orderPositions.map((item) =>
      resolveRatioAndTaxDivisorForPricingSheet(
        // TODO: use modules
        // this.context.modules.orders.orderPosition.pricing(item),
        /* @ts-ignore */
        item.pricing(),
        totalAmountOfItems
      )
    );

    let alreadyDeducted = 0;

    this.discounts.forEach(({ configuration, discountId }) => {
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
        this.result.addDiscounts({
          amount: discountAmount * -1,
          discountId,
          meta: {
            /* @ts-ignore */
            adapter: this.constructor.key,
          },
        });
        if (taxAmount !== 0) {
          this.result.addTaxes({
            amount: taxAmount * -1,
            meta: {
              discountId,
              /* @ts-ignore */
              adapter: this.constructor.key,
            },
          });
        }
      }
    });

    return super.calculate();
  }
}

OrderPricingDirector.registerAdapter(ItemsDiscount);
