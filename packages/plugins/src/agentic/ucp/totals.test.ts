import assert from 'node:assert';
import { describe, it } from 'node:test';
import { checkoutTotals, vatLines, type Total } from './totals.ts';

const assertInvariants = (totals: Total[]) => {
  assert.equal(totals.filter(({ type }) => type === 'subtotal').length, 1);
  assert.equal(totals.filter(({ type }) => type === 'total').length, 1);
  const total = totals.find(({ type }) => type === 'total')!;
  assert.equal(
    totals.filter(({ type }) => type !== 'total').reduce((sum, { amount }) => sum + amount, 0),
    total.amount,
  );
  for (const entry of totals) {
    assert.ok(Number.isInteger(entry.amount));
    if (entry.lines) {
      assert.equal(
        entry.lines.reduce((sum, { amount }) => sum + amount, 0),
        entry.amount,
      );
      assert.ok(entry.lines.every(({ amount }) => Number.isInteger(amount)));
    }
  }
};

describe('UCP totals', () => {
  it('itemizes a mixed 8.1 % / 2.6 % Swiss cart with shipping and a product discount', () => {
    const totals = checkoutTotals({
      subtotal: 14650,
      itemsDiscount: -2000,
      discount: 0,
      fulfillment: 900,
      fee: 0,
      total: 13550,
      taxSum: 659.7,
      rated: [
        { rate: 0.081, amount: 524.35 },
        { rate: 0.026, amount: 67.4 },
        { rate: 0.081, amount: 67.95 },
      ],
    });
    assertInvariants(totals);
    assert.deepEqual(totals, [
      { type: 'subtotal', amount: 14650 },
      { type: 'items_discount', amount: -2000 },
      { type: 'fulfillment', amount: 900 },
      {
        type: 'total',
        amount: 13550,
        lines: [
          { display_text: 'Net', amount: 12890 },
          { display_text: 'VAT 8.1%', amount: 592 },
          { display_text: 'VAT 2.6%', amount: 68 },
        ],
      },
    ]);
  });

  it('shows one combined VAT line when order discounts reduce the rated taxes', () => {
    const totals = checkoutTotals({
      subtotal: 20000,
      itemsDiscount: 0,
      discount: -10000,
      fulfillment: 0,
      fee: 0,
      total: 10000,
      taxSum: 749.3,
      rated: [{ rate: 0.081, amount: 1498.61 }],
    });
    assertInvariants(totals);
    assert.deepEqual(totals.at(-1)!.lines, [
      { display_text: 'Net', amount: 9251 },
      { display_text: 'VAT', amount: 749 },
    ]);
  });

  it('never shows more VAT than the engine rounds to', () => {
    const lines = vatLines(10000, 21, [
      { rate: 0.081, amount: 10.5 },
      { rate: 0.026, amount: 10.5 },
    ]);
    assert.equal(
      lines.slice(1).reduce((sum, { amount }) => sum + amount, 0),
      21,
    );
  });

  it('adds a rounding entry when the rounded categories do not reach the total', () => {
    const totals = checkoutTotals({
      subtotal: 9999,
      itemsDiscount: 0,
      discount: 0,
      fulfillment: 0,
      fee: 3,
      total: 10000,
      taxSum: 0,
      rated: [],
    });
    assertInvariants(totals);
    assert.deepEqual(totals, [
      { type: 'subtotal', amount: 9999 },
      { type: 'fee', amount: 3 },
      { type: 'rounding', display_text: 'Rounding', amount: -2 },
      { type: 'total', amount: 10000 },
    ]);
  });

  it('keeps an empty cart at zero without VAT lines', () => {
    const totals = checkoutTotals({
      subtotal: 0,
      itemsDiscount: 0,
      discount: 0,
      fulfillment: 0,
      fee: 0,
      total: 0,
      taxSum: 0,
      rated: [],
    });
    assert.deepEqual(totals, [
      { type: 'subtotal', amount: 0 },
      { type: 'total', amount: 0 },
    ]);
  });
});
