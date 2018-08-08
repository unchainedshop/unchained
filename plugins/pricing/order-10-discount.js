import {
  OrderPricingDirector,
  OrderPricingAdapter,
  OrderPricingSheetRowCategories,
} from 'meteor/unchained:core-pricing';

class OrderItems extends OrderPricingAdapter {
  static key = 'ch.dagobert.pricing.order-discount'

  static version = '1.0'

  static label = 'Bruttopreis + MwSt. aller Pauschal-Gutscheine summieren'

  static orderIndex = 10

  static isActivatedFor() {
    return true;
  }

  async calculate() {
    // discounts need to provide a *fixedRate*
    // if you want to add percentual discounts,
    // add it to the order item calculation

    let totalItemsAmount = this.calculation.sum({
      category: OrderPricingSheetRowCategories.Items,
    });

    const shares = this.context.items.map((item) => {
      const pricing = item.pricing();
      const tax = pricing.taxSum();
      const gross = pricing.gross();
      return {
        ratio: gross / totalItemsAmount,
        taxDivisor: gross / (gross - tax),
      };
    });

    this.discounts.forEach(({ configuration, discountId }) => {
      let discountAmount = 0;
      let taxAmount = 0;

      const discountAmountToSplit = configuration.rate
        ? totalItemsAmount * configuration.rate
        : Math.min(configuration.fixedRate, totalItemsAmount);

      shares.forEach(({ ratio, taxDivisor }) => {
        const shareAmount = discountAmountToSplit * ratio;
        const shareTaxAmount = shareAmount - (shareAmount / taxDivisor);
        discountAmount += shareAmount;
        taxAmount += shareTaxAmount;
      });

      if (discountAmount) {
        this.result.addDiscounts({
          amount: discountAmount * -1,
          discountId,
        });
        if (taxAmount !== 0) {
          this.result.addTaxes({
            amount: taxAmount * -1,
          });
        }
      }

      totalItemsAmount -= discountAmountToSplit;
    });

    return super.calculate();
  }
}

OrderPricingDirector.registerAdapter(OrderItems);
