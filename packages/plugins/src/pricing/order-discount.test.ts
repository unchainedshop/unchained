import { describe, it } from 'node:test';
import assert from 'node:assert';

import { OrderDiscount } from './order-discount.ts';

describe('OrderDelivery ', () => {
  it('isActivatedFor', () => {
    assert.equal(OrderDiscount.isActivatedFor({} as any), true);
  });
});
