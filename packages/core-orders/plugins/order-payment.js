import {
  OrderPricingDirector,
  OrderPricingAdapter,
} from 'meteor/unchained:core-orders';

class OrderPayment extends OrderPricingAdapter {
  static key = 'shop.unchained.pricing.order-payment';

  static version = '1.0';

  static label = 'Add Payment Fees to Order';

  static orderIndex = 20;

  static async isActivatedFor() {
    return true;
  }

  async calculate() {
    // just add tax + net price to order pricing
    const { orderPayment } = this.context;
    if (orderPayment) {
      // TODO: use module
      // @ts-ignore */
      const pricing = orderPayment.pricing();
      const tax = pricing.taxSum();
      const paymentFees = pricing.gross();

      this.result.addPayment({ amount: paymentFees });
      if (tax !== 0) {
        this.result.addTaxes({ amount: tax });
      }
    }
    return super.calculate();
  }
}

OrderPricingDirector.registerAdapter(OrderPayment);
