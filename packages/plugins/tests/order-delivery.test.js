import {  OrderDelivery } from '../src/pricing/order-delivery';

describe("OrderDelivery ", () => {

  it('isActivatedFor', () => {
    expect(OrderDelivery.isActivatedFor()).toBeTruthy();
  });
})
