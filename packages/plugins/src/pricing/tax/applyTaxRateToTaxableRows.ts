import type { PricingCalculation } from '@unchainedshop/utils';

export interface TaxableCalculation extends PricingCalculation {
  isTaxable?: boolean;
  isNetPrice?: boolean;
}

export interface TaxResultSheet {
  calculation: PricingCalculation[];
  addTax: (row: { amount: number; rate: number; baseCategory: string; meta?: unknown }) => void;
}

/**
 * Apply a tax rate to every `isTaxable` row of a calculation sheet — the
 * shared math of all regional tax adapters: gross rows get the tax extracted
 * (negative offset row + tax row), net rows get it added on top (tax row
 * only).
 */
export const applyTaxRateToTaxableRows = <Calculation extends TaxableCalculation>({
  calculationSheet,
  resultSheet,
  taxRate,
  baseCategory,
  adapterKey,
}: {
  calculationSheet: { filterBy: (filter?: Partial<Calculation>) => Calculation[] };
  resultSheet: TaxResultSheet;
  taxRate: number;
  baseCategory: string;
  adapterKey: string;
}): void => {
  calculationSheet
    .filterBy({ isTaxable: true } as Partial<Calculation>)
    .forEach(({ isNetPrice, ...row }) => {
      if (!isNetPrice) {
        const taxAmount = row.amount - row.amount / (1 + taxRate);
        resultSheet.calculation.push({
          ...row,
          amount: -taxAmount,
          isTaxable: false,
          isNetPrice: false,
          meta: { adapter: adapterKey },
        });
        resultSheet.addTax({
          amount: taxAmount,
          rate: taxRate,
          baseCategory,
          meta: { adapter: adapterKey },
        });
      } else {
        resultSheet.addTax({
          amount: row.amount * taxRate,
          rate: taxRate,
          baseCategory,
          meta: { adapter: adapterKey },
        });
      }
    });
};
