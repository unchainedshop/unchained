import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProductPricingSheet } from './ProductPricingSheet.ts';
import { DeliveryPricingSheet } from './DeliveryPricingSheet.ts';
import { PaymentPricingSheet } from './PaymentPricingSheet.ts';

const currencyCode = 'CHF';
const rate = 0.081;

// Extract the tax from every gross taxable row the way the regional tax adapters do: an
// offset row in the source row's category plus a tax row attributed to that category
// and discount.
const extractTaxes = (sheet) => {
  sheet.filterBy({ isTaxable: true }).forEach(({ category, amount, discountId }) => {
    const taxAmount = amount - amount / (1 + rate);
    sheet.calculation.push({
      category,
      amount: -taxAmount,
      discountId,
      isTaxable: false,
      isNetPrice: false,
    });
    sheet.addTax({ amount: taxAmount, rate, baseCategory: category, discountId });
  });
};

// CHF 200.00 gross with a CHF 100.00 gross discount, 8.1% VAT included in both
for (const [name, createSheet, base] of [
  [
    'ProductPricingSheet',
    () => ProductPricingSheet({ calculation: [], currencyCode, quantity: 2 }),
    (sheet) => sheet.addItem({ amount: 20000, isTaxable: true, isNetPrice: false }),
  ],
  [
    'DeliveryPricingSheet',
    () => DeliveryPricingSheet({ calculation: [], currencyCode }),
    (sheet) => sheet.addFee({ amount: 20000, isTaxable: true, isNetPrice: false }),
  ],
  [
    'PaymentPricingSheet',
    () => PaymentPricingSheet({ calculation: [], currencyCode }),
    (sheet) => sheet.addFee({ amount: 20000, isTaxable: true, isNetPrice: false }),
  ],
] as const) {
  describe(`${name} taxed discounts`, () => {
    const sheet: any = (createSheet as any)();
    (base as any)(sheet);
    sheet.addDiscount({ amount: -10000, isTaxable: true, isNetPrice: false, discountId: 'half' });
    extractTaxes(sheet);

    it('keeps the base category and discount of a tax row', () => {
      const discountTax = sheet.filterBy({ category: 'TAX', discountId: 'half' });
      assert.equal(discountTax.length, 1);
      assert.equal(discountTax[0].baseCategory, 'DISCOUNT');
    });

    it('totals the discount category gross and net', () => {
      assert.equal(sheet.total({ category: 'DISCOUNT' }).amount, -10000);
      assert.equal(sheet.total({ category: 'DISCOUNT', useNetPrice: true }).amount, -9251);
    });

    it('prices the discount gross, flagged taxable', () => {
      assert.deepEqual(sheet.discountPrices('half'), [
        { discountId: 'half', amount: -10000, currencyCode, isTaxable: true, isNetPrice: false },
      ]);
    });
  });
}
