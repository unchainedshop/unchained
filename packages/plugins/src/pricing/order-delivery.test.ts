import { OrderDelivery } from "./order-delivery.js";


describe("OrderDelivery ", () => {

  it('isActivatedFor', () => {
    expect(OrderDelivery.isActivatedFor(undefined)).toBeTruthy();
  });
})
