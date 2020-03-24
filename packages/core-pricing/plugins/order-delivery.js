import {
  OrderPricingDirector,
  OrderPricingAdapter
} from 'meteor/unchained:core-pricing';

class OrderDelivery extends OrderPricingAdapter {
  static key = 'shop.unchained.pricing.order-delivery';

  static version = '1.0';

  static label = 'Bruttopreis + MwSt. aller Versandgebühren summieren';

  static orderIndex = 10;

  static isActivatedFor() {
    return true;
  }

  async calculate() {
    // just add tax + net price to order pricing
    const { delivery } = this.context;
    if (delivery) {
      const pricing = delivery.pricing();
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
