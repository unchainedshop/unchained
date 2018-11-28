import { OrderPricingDirector, OrderPricingAdapter } from 'meteor/unchained:core-pricing';

class OrderItems extends OrderPricingAdapter {
  static key = 'shop.unchained.pricing.order-items'

  static version = '1.0'

  static label = 'Bruttopreis + MwSt. aller Artikel summieren'

  static orderIndex = 0

  static isActivatedFor() {
    return true;
  }

  async calculate() {
    // just sum up all products items prices, taxes & fees
    const totalAndTaxesOfAllItems = this.context.items
      .reduce(
        (current, item) => {
          const pricing = item.pricing();
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
    this.result.addItems({ amount: totalAndTaxesOfAllItems.items });
    if (totalAndTaxesOfAllItems.taxes !== 0) {
      this.result.addTaxes({ amount: totalAndTaxesOfAllItems.taxes });
    }
    return super.calculate();
  }
}

OrderPricingDirector.registerAdapter(OrderItems);
