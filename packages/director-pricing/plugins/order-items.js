import {
  OrderPricingDirector,
  OrderPricingAdapter,
} from 'meteor/unchained:director-pricing';

class OrderItems extends OrderPricingAdapter {
  static key = 'shop.unchained.pricing.order-items';

  static version = '1.0';

  static label = 'Add Total Value Of Goods to Order';

  static orderIndex = 0;

  static async isActivatedFor() {
    return true;
  }

  async calculate() {
    // just sum up all products items prices, taxes & fees
    const totalAndTaxesOfAllItems = this.context.orderPositions.reduce(
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
    this.result.addItems({ amount: totalAndTaxesOfAllItems.items });
    if (totalAndTaxesOfAllItems.taxes !== 0) {
      this.result.addTaxes({ amount: totalAndTaxesOfAllItems.taxes });
    }
    return super.calculate();
  }
}

OrderPricingDirector.registerAdapter(OrderItems);
