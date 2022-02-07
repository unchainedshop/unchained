import { PricingCalculation, IBasePricingSheet, PricingSheetParams } from '@unchainedshop/types/pricing';

export const BasePricingSheet = <Calculation extends PricingCalculation>(
  params: PricingSheetParams<Calculation>,
): IBasePricingSheet<Calculation> => {
  const calculation = params.calculation || [];

  const pricingSheet: IBasePricingSheet<Calculation> = {
    calculation,
    currency: params.currency,
    quantity: params.quantity,

    getRawPricingSheet: () => {
      return calculation;
    },

    isValid: () => {
      return calculation.length > 0;
    },

    sum: (filter) => {
      return pricingSheet
        .filterBy(filter)
        .filter(Boolean)
        .reduce((sum: number, calculationRow: Calculation) => sum + calculationRow.amount, 0);
    },

    taxSum: () => {
      return 0;
    },

    gross: () => {
      return pricingSheet.sum();
    },

    net: () => {
      return pricingSheet.gross() - pricingSheet.taxSum();
    },

    total: ({ category, useNetPrice } = { useNetPrice: false }) => {
      if (!category) {
        return {
          amount: Math.round(useNetPrice ? pricingSheet.net() : pricingSheet.gross()),
          currency: params.currency,
        };
      }

      return {
        amount: Math.round(pricingSheet.sum({ category } as any)),
        currency: params.currency,
      };
    },

    filterBy: (filter) => {
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
  };

  return pricingSheet;
};
