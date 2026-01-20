import { OrderDelivery } from './adapter.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('OrderDelivery ', () => {
  it('isActivatedFor', () => {
    assert.equal(OrderDelivery.isActivatedFor({} as any), true);
  });
});
