import {
  OrderPricingDirector,
  OrderPricingAdapter,
  OrderPricingSheetRowCategories,
} from 'meteor/unchained:core-pricing';

const resolveRatioAndTaxDivisorForPricingSheet = (pricing, total) => {
  if (total === 0 || !pricing) {
    return {
      ratio: 1,
      taxDivisor: 1,
    };
  }
  const tax = pricing.taxSum();
  const gross = pricing.gross();
  if (gross - tax === 0) {
    return {
      ratio: 0,
      taxDivisor: 0,
    };
  }
  return {
    ratio: gross / total,
    taxDivisor: gross / (gross - tax),
  };
};

const resolveAmountAndTax = ({ ratio, taxDivisor }, amount) => {
  const shareAmount = Number.isFinite(ratio) ? amount * ratio : 0;
  const shareTaxAmount =
    Number.isFinite(taxDivisor) && taxDivisor !== 0
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
    : configuration.fixedRate;

  const leftInDiscount = Math.max(
    0,
    deductionAmount - (configuration.alreadyDeductedForDiscount || 0)
  );
  const leftToDeduct = Math.min(configuration.amountLeft, leftInDiscount);
  return Math.max(0, leftToDeduct);
};

class OrderItems extends OrderPricingAdapter {
  static key = 'shop.unchained.pricing.order-discount';

  static version = '1.0';

  static label = 'Apply Discounts on Total Order Value';

  static orderIndex = 90;

  static isActivatedFor() {
    return true;
  }

  async calculate() {
    // discounts need to provide a *fixedRate*
    // if you want to add percentual discounts,
    // add it to the order item calculation

    const totalAmountOfItems = this.calculation.sum({
      category: OrderPricingSheetRowCategories.Items,
    });
    const totalAmountOfPaymentAndDelivery =
      this.calculation.sum({
        category: OrderPricingSheetRowCategories.Payment,
      }) +
      this.calculation.sum({
        category: OrderPricingSheetRowCategories.Delivery,
      });

    const itemShares = this.context.items.map((item) =>
      resolveRatioAndTaxDivisorForPricingSheet(
        item.pricing(),
        totalAmountOfItems
      )
    );
    const deliveryShare = resolveRatioAndTaxDivisorForPricingSheet(
      this.context.delivery?.pricing(),
      totalAmountOfPaymentAndDelivery
    );
    const paymentShare = resolveRatioAndTaxDivisorForPricingSheet(
      this.context.payment?.pricing(),
      totalAmountOfPaymentAndDelivery
    );

    let amountLeft = totalAmountOfPaymentAndDelivery + totalAmountOfItems;

    this.discounts.forEach(({ configuration, discountId }) => {
      // First, we deduce the discount from the items
      let alreadyDeductedForDiscount = 0;
      const [itemsDiscountAmount, itemsTaxAmount] =
        applyDiscountToMultipleShares(
          itemShares,
          calculateAmountToSplit(
            { ...configuration, amountLeft, alreadyDeductedForDiscount },
            totalAmountOfItems
          )
        );
      amountLeft -= itemsDiscountAmount;
      alreadyDeductedForDiscount += itemsDiscountAmount;

      // After the items, we deduct the remaining discount from payment & delivery fees
      const [deliveryAndPaymentDiscountAmount, deliveryAndPaymentTaxAmount] =
        applyDiscountToMultipleShares(
          [deliveryShare, paymentShare],
          calculateAmountToSplit(
            { ...configuration, amountLeft, alreadyDeductedForDiscount },
            totalAmountOfPaymentAndDelivery
          )
        );
      amountLeft -= deliveryAndPaymentDiscountAmount;
      alreadyDeductedForDiscount += itemsDiscountAmount;

      const discountAmount =
        itemsDiscountAmount + deliveryAndPaymentDiscountAmount;
      const taxAmount = itemsTaxAmount + deliveryAndPaymentTaxAmount;

      if (discountAmount) {
        this.result.addDiscounts({
          amount: discountAmount * -1,
          discountId,
          meta: {
            adapter: this.constructor.key,
          },
        });
        if (taxAmount !== 0) {
          this.result.addTaxes({
            amount: taxAmount * -1,
            meta: {
              discountId,
              adapter: this.constructor.key,
            },
          });
        }
      }
    });

    return super.calculate();
  }
}

OrderPricingDirector.registerAdapter(OrderItems);
