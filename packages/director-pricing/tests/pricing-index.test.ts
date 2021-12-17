import { assert } from 'chai';
import {
  DeliveryPricingAdapter, DeliveryPricingDirector, DeliveryPricingSheet, OrderPricingAdapter, OrderPricingDirector, OrderPricingSheet, PaymentPricingAdapter, PaymentPricingDirector, PaymentPricingSheet, ProductPricingAdapter, ProductPricingDirector, ProductPricingSheet
} from 'meteor/unchained:director-pricing';

describe('Test exports', () => {
  it('Check exports', () => {
    assert.ok(DeliveryPricingAdapter);
    assert.ok(DeliveryPricingSheet);
    assert.ok(DeliveryPricingDirector);
    assert.ok(OrderPricingAdapter);
    assert.ok(OrderPricingSheet);
    assert.ok(OrderPricingDirector);
    assert.ok(PaymentPricingAdapter);
    assert.ok(PaymentPricingSheet);
    assert.ok(PaymentPricingDirector);
    assert.ok(ProductPricingAdapter);
    assert.ok(ProductPricingSheet);
    assert.ok(ProductPricingDirector);
  });
});
