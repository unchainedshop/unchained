import {
  PricingCalculation,
  IBasePricingSheet,
  PricingSheetParams,
} from '@unchainedshop/types/pricing.js';

export const BasePricingSheet = <Calculation extends PricingCalculation>(
  params: PricingSheetParams<Calculation>,
): IBasePricingSheet<Calculation> => {
  const calculation = params.calculation || [];

  const pricingSheet: IBasePricingSheet<Calculation> = {
    calculation,
    currency: params.currency,
    quantity: params.quantity,

    getRawPricingSheet() {
      return calculation;
    },

    isValid() {
      return calculation.length > 0;
    },

    sum(filter) {
      return this.filterBy(filter)
        .filter(Boolean)
        .reduce((sum: number, calculationRow: Calculation) => sum + calculationRow.amount, 0);
    },

    taxSum() {
      return 0;
    },

    gross() {
      return this.sum();
    },

    net() {
      return this.gross() - this.taxSum();
    },

    total({ category, useNetPrice } = { useNetPrice: false }) {
      if (!category) {
        return {
          amount: Math.round(useNetPrice ? this.net() : this.gross()),
          currency: params.currency,
        };
      }

      return {
        amount: Math.round(this.sum({ category } as any)),
        currency: params.currency,
      };
    },

    filterBy(filter) {
      const filteredCalculation = Object.keys(filter || {}).reduce(
        (oldCalculation, filterKey) =>
          oldCalculation.filter(
            (row: Calculation) =>
              !!row && (filter[filterKey] === undefined || row[filterKey] === filter[filterKey]),
          ),
        calculation,
      );

      return filteredCalculation;
    },

    resetCalculation(calculationSheet) {
      calculationSheet.filterBy().forEach(({ amount, ...row }: Calculation) => {
        pricingSheet.calculation.push({
          ...row,
          amount: amount * -1,
        } as Calculation);
      });
      return pricingSheet.calculation;
    },
  };

  return pricingSheet;
};
