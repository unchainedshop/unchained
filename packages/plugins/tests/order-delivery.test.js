import {  OrderDelivery } from '../src/pricing/order-delivery';

describe("OrderDelivery ", () => {

  it('isActivatedFor', () => {
    expect(OrderDelivery.isActivatedFor()).toBeTruthy();
  });

  it('has correct keys', () => {
    expect(OrderDelivery.key).toEqual('shop.unchained.pricing.order-delivery');
    expect(OrderDelivery.label).toEqual('Add Delivery Fees to Order');
    expect(OrderDelivery.version).toEqual('1.0.0');
    expect(OrderDelivery.orderIndex).toEqual(10);
  });


})
