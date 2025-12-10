import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HalfPrice } from './discount-half-price.ts';

describe('HalfPrice', () => {
  it('isManualAdditionAllowed', async () => {
    assert.strictEqual(await HalfPrice.isManualAdditionAllowed(''), false);
  });

  it('isManualRemovalAllowed', async () => {
    assert.strictEqual(await HalfPrice.isManualRemovalAllowed(), false);
  });

  it('isValidForSystemTriggering', async () => {
    const context = {
      modules: {
        users: {
          findUserById: async () => ({ tags: ['half-price'] }),
        },
      },
      order: { userId: 'user-id' },
    };
    const actions = await HalfPrice.actions({ context } as any);
    assert.strictEqual(await actions.isValidForSystemTriggering(), true);

    context.modules.users.findUserById = async () => ({ tags: [] });
    assert.strictEqual(await actions.isValidForSystemTriggering(), false);
  });

  it('discountForPricingAdapterKey', async () => {
    const context = {};
    const actions = await HalfPrice.actions({ context } as any);
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

  it('isValidForCodeTriggering', async () => {
    const context = {};
    const actions = await HalfPrice.actions({ context } as any);
    assert.strictEqual(await actions.isValidForCodeTriggering({ code: '' }), false);
  });
});
