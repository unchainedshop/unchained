import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HalfPriceManual } from './discount-half-price-manual.js';

describe('HalfPriceManual', () => {
  it('isManualAdditionAllowed', async () => {
    let x;
    assert.strictEqual(await HalfPriceManual.isManualAdditionAllowed(x), true);
  });

  it('isManualRemovalAllowed', async () => {
    assert.strictEqual(await HalfPriceManual.isManualRemovalAllowed(), true);
  });

  it('isValidForSystemTriggering', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context } as any);
    assert.strictEqual(await actions.isValidForSystemTriggering(), false);
  });

  it('isValidForCodeTriggering', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context } as any);
    assert.strictEqual(await actions.isValidForCodeTriggering({ code: 'HALFPRICE' }), true);
    assert.strictEqual(await actions.isValidForCodeTriggering({ code: 'othercode' }), false);
  });

  it('discountForPricingAdapterKey', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context } as any);
    assert.deepStrictEqual(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.product-discount',
      } as any),
      { rate: 0.5 },
    );
    assert.strictEqual(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.other-discount',
      } as any),
      null,
    );
  });

  it('Actions', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context } as any);
    assert.strictEqual(typeof actions.isValidForSystemTriggering, 'function');
    assert.strictEqual(typeof actions.isValidForCodeTriggering, 'function');
    assert.strictEqual(typeof actions.discountForPricingAdapterKey, 'function');
  });
});
