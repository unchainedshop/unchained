import {
  OrderPricingDirector,
  OrderPricingAdapter,
} from 'meteor/unchained:core-pricing';

class OrderPayment extends OrderPricingAdapter {
  static key = 'ch.dagobert.pricing.order-payment'
  static version = '1.0'
  static label = 'Bruttopreis + MwSt. aller Zahlungsgebühren summieren'
  static orderIndex = 30
  static isActivatedFor() {
    return true;
  }

  calculate() {
    // just add tax + net price to order pricing
    const { payment } = this.context;
    if (payment) {
      const pricing = payment.pricing();
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
