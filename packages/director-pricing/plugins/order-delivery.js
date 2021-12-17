import {
  OrderPricingDirector,
  OrderPricingAdapter,
} from 'meteor/unchained:director-pricing';

class OrderDelivery extends OrderPricingAdapter {
  static key = 'shop.unchained.pricing.order-delivery';

  static version = '1.0';

  static label = 'Add Delivery Fees to Order';

  static orderIndex = 10;

  static async isActivatedFor() {
    return true;
  }

  async calculate() {
    // just add tax + net price to order pricing
    const { orderDelivery } = this.context;
    if (orderDelivery) {
      // TODO: use module
      // @ts-ignore */
      const pricing = orderDelivery.pricing();
      const tax = pricing.taxSum();
      const shipping = pricing.gross();

      this.result.addDelivery({ amount: shipping });
      if (tax !== 0) {
        this.result.addTaxes({ amount: tax });
      }
    }
    return super.calculate();
  }
}

OrderPricingDirector.registerAdapter(OrderDelivery);
