import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReimbursementCode } from './adapter.ts';

test('reimbursement pricing applies only the unspent minor-unit balance', async () => {
  for (const used of [0, 1, 4000, 6000, 9999, 10000]) {
    const context = {
      code: 'voucher',
      order: { _id: 'cart', currencyCode: 'CHF' },
      modules: {
        passes: {
          verifyDiscountCode: async () => 10000,
          discountCodeUsageBalance: async () => used,
        },
      },
    };
    const actions = await ReimbursementCode.actions({ context: context as any });
    if (used < 10000) {
      assert.equal(await actions.isValidForCodeTriggering({ code: 'voucher' }), true);
      assert.deepEqual(
        actions.discountForPricingAdapterKey({
          pricingAdapterKey: 'shop.unchained.pricing.order-discount',
          calculationSheet: {} as any,
        }),
        { fixedRate: 10000 - used },
      );
    } else {
      await assert.rejects(
        actions.isValidForCodeTriggering({ code: 'voucher' }),
        /DISCOUNT_USAGE_LIMIT_EXCEEDED/,
      );
    }
  }
});

test('unknown codes and shops without the ticketing module never validate', async () => {
  for (const modules of [{}, { passes: { verifyDiscountCode: async () => null } }]) {
    const actions = await ReimbursementCode.actions({
      context: { code: 'voucher', order: { _id: 'cart', currencyCode: 'CHF' }, modules } as any,
    });
    assert.equal(await actions.isValidForCodeTriggering({ code: 'voucher' }), false);
    assert.equal(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.order-discount',
        calculationSheet: {} as any,
      }),
      null,
    );
    await assert.rejects(actions.prepareForCheckout!(), /INVALID_REIMBURSEMENT_CODE/);
  }
});
