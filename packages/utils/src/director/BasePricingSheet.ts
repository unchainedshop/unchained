import {
  PricingCalculation,
  IBasePricingSheet,
  PricingSheetParams,
} from '@unchainedshop/types/pricing.js';

export const BasePricingSheet = <Calculation extends PricingCalculation>(
  params: PricingSheetParams<Calculation>,
): IBasePricingSheet<Calculation> => {
  const pricingSheet: IBasePricingSheet<Calculation> = {
    calculation: params.calculation || [],
    currency: params.currency,
    quantity: params.quantity,

    getRawPricingSheet() {
      return this.calculation;
    },

    isValid() {
      return this.calculation.length > 0;
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
      // Sum contains taxes, thus it's gross when just suming everything
      return this.sum();
    },

    net() {
      // Remove all taxes from gross to get net
      return this.sum() - this.taxSum();
    },

    total({ category, useNetPrice } = { useNetPrice: false }) {
      if (!category) {
        return {
          amount: Math.round(useNetPrice ? this.net() : this.gross()),
          currency: params.currency,
        };
      }
      // Sum does not contain taxes when filtering by category, thus it's net
      const netAmount = this.sum(category && { category });
      const taxAmountForCategory = this.taxSum(category && { baseCategory: category });

      return {
        amount: Math.round(useNetPrice ? netAmount : netAmount + taxAmountForCategory),
        currency: this.currency,
      };
    },

    filterBy(filter) {
      const filteredCalculation = Object.keys(filter || {}).reduce(
        (oldCalculation, filterKey) =>
          oldCalculation.filter(
            (row: Calculation) =>
              !!row && (filter[filterKey] === undefined || row[filterKey] === filter[filterKey]),
          ),
        this.calculation,
      );

      return filteredCalculation;
    },

    resetCalculation(calculationSheet) {
      calculationSheet.filterBy().forEach(({ amount, ...row }: Calculation) => {
        this.calculation.push({
          ...row,
          amount: amount * -1,
        } as Calculation);
      });
      return this.calculation;
    },
  };

  return pricingSheet;
};
