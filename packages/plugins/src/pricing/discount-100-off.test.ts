import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HundredOff } from './discount-100-off.ts';

describe('HundredOff', () => {
  it('isManualAdditionAllowed', async () => {
    let x;
    assert.strictEqual(await HundredOff.isManualAdditionAllowed(x), true);
  });
  it('isManualRemovalAllowed', async () => {
    assert.strictEqual(await HundredOff.isManualRemovalAllowed(), true);
  });
  it('isValidForSystemTriggering', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context } as any);
    assert.strictEqual(await actions.isValidForSystemTriggering(), false);
  });
  it('isValidForCodeTriggering', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context } as any);
    assert.strictEqual(await actions.isValidForCodeTriggering({ code: '100OFF' }), true);
    assert.strictEqual(await actions.isValidForCodeTriggering({ code: 'wrongcode' }), false);
  });

  it('discountForPricingAdapterKey', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context } as any);
    assert.deepStrictEqual(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.order-discount',
      } as any),
      { fixedRate: 10000 },
    );
    assert.strictEqual(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.other-discount',
      } as any),
      null,
    );
  });
});
