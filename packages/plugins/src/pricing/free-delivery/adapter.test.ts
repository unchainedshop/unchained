import { describe, it } from 'node:test';
import assert from 'node:assert';

import { DeliveryFreePrice } from './adapter.ts';

describe('DeliveryFreePrice', () => {
  it('should return true', () => {
    assert.strictEqual(DeliveryFreePrice.isActivatedFor(undefined as any), true);
  });
});
