import { describe, it } from 'node:test';
import assert from 'node:assert';
import denoteAmount from './denote-amount.js';

describe('Denote Amount', () => {
  it('Handle amount with 18 decimals', () => {
    // For example, Ethereum uses 18 decimals, this converts WEI to GWei
    assert.equal(denoteAmount('1000000000000000000', 18), 1000000000n);
    assert.equal(denoteAmount('100000000000000', 18), 100000n);
    assert.equal(denoteAmount('100', 18), 0n);
  });
  it('Handle amount with 10 decimals', () => {
    assert.equal(denoteAmount('100000000', 10), 10000000n);
    assert.equal(denoteAmount('100000000000000', 10), 10000000000000n);
    assert.equal(denoteAmount('100', 10), 10n);
  });
  it('Handle amount with 8 decimals', () => {
    // For example, Bitcoin uses 8 decimals, this keeps Satoshi as is
    assert.equal(denoteAmount('100000000', 8), 100000000n);
    assert.equal(denoteAmount('100000000000000', 8), 100000000000000n);
    assert.equal(denoteAmount('1', 8), 1n);
  });
  it('Handle amount with 2 decimals', () => {
    assert.equal(denoteAmount('100000000', 2), 100000000n);
    assert.equal(denoteAmount('100000000000000', 2), 100000000000000n);
    assert.equal(denoteAmount('1', 2), 1n);
  });
});
