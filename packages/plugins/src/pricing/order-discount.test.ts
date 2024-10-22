import { OrderDiscount } from './order-discount.js';

describe('OrderDelivery ', () => {
  it('isActivatedFor', () => {
    expect(OrderDiscount.isActivatedFor({} as any)).toBeTruthy();
  });
});
