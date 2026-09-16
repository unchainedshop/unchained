import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultDiscountCodeHandlers } from './discount-codes.ts';

test('default reimbursement codes require a secret and preserve exact amounts', async () => {
  const previous = process.env.DISCOUNT_CODE_SECRET;
  try {
    delete process.env.DISCOUNT_CODE_SECRET;
    const disabled = createDefaultDiscountCodeHandlers();
    await assert.rejects(disabled.generate(1999, 'CHF'), /DISCOUNT_CODE_SECRET/);
    assert.equal(await disabled.verify('unissued', 'CHF'), null);

    process.env.DISCOUNT_CODE_SECRET = 'ab'.repeat(32);
    const handlers = createDefaultDiscountCodeHandlers();
    for (const amount of [1, 99, 1999, 25600, 51200, 6553601, Number.MAX_SAFE_INTEGER]) {
      const code = await handlers.generate(amount, 'CHF');
      assert.equal(await handlers.verify(code, 'CHF'), amount);
      assert.equal(await handlers.verify(code, 'EUR'), null);
      assert.equal(await handlers.verify(`${code}=`, 'CHF'), null);
      assert.equal(await handlers.verify(`x${code}`, 'CHF'), null);
    }
    const codes = await Promise.all(Array.from({ length: 1000 }, () => handlers.generate(1999, 'CHF')));
    assert.equal(new Set(codes).size, codes.length);
    for (const amount of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      await assert.rejects(handlers.generate(amount, 'CHF'));
    }
    const code = await handlers.generate(1999, 'CHF');
    process.env.DISCOUNT_CODE_SECRET = 'cd'.repeat(32);
    assert.equal(await createDefaultDiscountCodeHandlers().verify(code, 'CHF'), null);
    process.env.DISCOUNT_CODE_SECRET = 'invalid';
    assert.throws(createDefaultDiscountCodeHandlers, /DISCOUNT_CODE_SECRET/);
  } finally {
    if (previous === undefined) delete process.env.DISCOUNT_CODE_SECRET;
    else process.env.DISCOUNT_CODE_SECRET = previous;
  }
});
