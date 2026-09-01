import { describe, it } from 'node:test';
import assert from 'node:assert';
import { applyTaxRateToTaxableRows } from './applyTaxRateToTaxableRows.ts';

const makeSheets = (rows: Record<string, unknown>[]) => {
  const pushed: Record<string, unknown>[] = [];
  const taxes: Record<string, unknown>[] = [];
  return {
    calculationSheet: {
      filterBy: (filter: Record<string, unknown> = {}) =>
        rows.filter((row) => Object.entries(filter).every(([key, value]) => row[key] === value)),
    },
    resultSheet: {
      calculation: pushed,
      addTax: (row: Record<string, unknown>) => taxes.push(row),
    },
    pushed,
    taxes,
  };
};

describe('applyTaxRateToTaxableRows', () => {
  it('extracts tax from gross rows: negative offset row + tax row', () => {
    const { calculationSheet, resultSheet, pushed, taxes } = makeSheets([
      { category: 'ITEM', amount: 1081, isTaxable: true, isNetPrice: false },
    ]);
    applyTaxRateToTaxableRows({
      calculationSheet,
      resultSheet,
      taxRate: 0.081,
      baseCategory: 'ITEM',
      adapterKey: 'test-adapter',
    } as any);

    assert.strictEqual(pushed.length, 1);
    const offset = pushed[0] as any;
    assert.strictEqual(Math.round(offset.amount * 1000) / 1000, -81);
    assert.strictEqual(offset.isTaxable, false);
    assert.strictEqual(offset.isNetPrice, false);
    assert.deepStrictEqual(offset.meta, { adapter: 'test-adapter' });

    assert.strictEqual(taxes.length, 1);
    const tax = taxes[0] as any;
    assert.strictEqual(Math.round(tax.amount * 1000) / 1000, 81);
    assert.strictEqual(tax.rate, 0.081);
    assert.strictEqual(tax.baseCategory, 'ITEM');
    // gross stays constant: original + offset + tax = original
    assert.strictEqual(Math.round(1081 + offset.amount + tax.amount), 1081);
  });

  it('adds tax on top of net rows: tax row only, no offset', () => {
    const { calculationSheet, resultSheet, pushed, taxes } = makeSheets([
      { category: 'ITEM', amount: 1000, isTaxable: true, isNetPrice: true },
    ]);
    applyTaxRateToTaxableRows({
      calculationSheet,
      resultSheet,
      taxRate: 0.081,
      baseCategory: 'ITEM',
      adapterKey: 'test-adapter',
    } as any);

    assert.strictEqual(pushed.length, 0);
    assert.strictEqual(taxes.length, 1);
    assert.strictEqual((taxes[0] as any).amount, 81);
  });

  it('ignores rows that are not taxable', () => {
    const { calculationSheet, resultSheet, pushed, taxes } = makeSheets([
      { category: 'ITEM', amount: 500, isTaxable: false, isNetPrice: false },
      { category: 'ITEM', amount: 300 },
    ]);
    applyTaxRateToTaxableRows({
      calculationSheet,
      resultSheet,
      taxRate: 0.081,
      baseCategory: 'ITEM',
      adapterKey: 'test-adapter',
    } as any);

    assert.strictEqual(pushed.length, 0);
    assert.strictEqual(taxes.length, 0);
  });

  it('handles negative (discount) gross rows with inverted signs', () => {
    const { calculationSheet, resultSheet, pushed, taxes } = makeSheets([
      { category: 'DISCOUNT', amount: -1081, isTaxable: true, isNetPrice: false },
    ]);
    applyTaxRateToTaxableRows({
      calculationSheet,
      resultSheet,
      taxRate: 0.081,
      baseCategory: 'DISCOUNT',
      adapterKey: 'test-adapter',
    } as any);

    assert.strictEqual(Math.round((pushed[0] as any).amount * 1000) / 1000, 81);
    assert.strictEqual(Math.round((taxes[0] as any).amount * 1000) / 1000, -81);
  });
});
