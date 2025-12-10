import { OrderDelivery } from './order-delivery.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('OrderDelivery ', () => {
  it('isActivatedFor', () => {
    assert.equal(OrderDelivery.isActivatedFor({} as any), true);
  });
});
