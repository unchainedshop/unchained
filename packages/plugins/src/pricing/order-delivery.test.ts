import { OrderDelivery } from "./order-delivery.js";


describe("OrderDelivery ", () => {

  it('isActivatedFor', () => {
    expect(OrderDelivery.isActivatedFor({} as any)).toBeTruthy();
  });
})
