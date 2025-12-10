import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BaseDiscountAdapter } from './BaseDiscountAdapter.ts';

describe('BaseDiscountAdapter instantiation', () => {
  const adapter = BaseDiscountAdapter;
  const context = null as any;
  it('should initialize with default values', async () => {
    assert.equal(adapter.orderIndex, 0);
    assert.equal(typeof adapter.log, 'function');
    assert.equal(await adapter.isManualAdditionAllowed(''), false);
    assert.equal(await adapter.isManualRemovalAllowed(), false);
    assert.deepStrictEqual(Object.keys(await adapter.actions(context)), [
      'isValidForSystemTriggering',
      'reserve',
      'release',
      'isValidForCodeTriggering',
      'discountForPricingAdapterKey',
    ]);
  });

  describe('actions', () => {
    it('isValidForSystemTriggering', async () => {
      const result = await adapter.actions(context);
      assert.equal(await result.isValidForSystemTriggering(), false);
    });

    it('reserve', async () => {
      const result = await adapter.actions(context);
      assert.deepEqual(await result.reserve({ code: '' }), {});
    });

    it('release', async () => {
      const result = await adapter.actions(context);
      assert.equal(await result.release(), undefined);
    });

    it('isValidForCodeTriggering', async () => {
      const result = await adapter.actions(context);
      assert.equal(await result.isValidForCodeTriggering({ code: '' }), false);
    });

    it('discountForPricingAdapterKey', async () => {
      const result = await adapter.actions(context);
      const calculationSheet = {};
      assert.equal(
        await result.discountForPricingAdapterKey({ calculationSheet, pricingAdapterKey: 'key' } as any),
        null,
      );
    });
  });
});
