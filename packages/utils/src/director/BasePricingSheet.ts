export interface PricingCalculation {
  category: string;
  amount: number;
  baseCategory?: string;
  meta?: any;
}
export interface PricingDiscount {
  discountId: string;
  amount: number;
  currency: string;
}

export interface IPricingSheet<Calculation extends PricingCalculation>
  extends IBasePricingSheet<Calculation> {
  discountPrices: (discountId?: string) => Array<PricingDiscount>;
  addDiscount: (params: { amount: number; discountId: string; meta?: any }) => void;
}

export interface IBasePricingSheet<Calculation extends PricingCalculation> {
  calculation: Array<Calculation>;
  currency?: string;
  quantity?: number;

  getRawPricingSheet: () => Array<Calculation>;
  filterBy: (filter?: Partial<Calculation>) => Array<Calculation>;
  isValid: () => boolean;

  gross: () => number;
  net: () => number;
  sum: (filter?: Partial<Calculation>) => number;
  total: (params?: { category?: string; discountId?: string; useNetPrice?: boolean }) => {
    amount: number;
    currency: string;
  };

  taxSum: (filter?: Partial<Calculation>) => number;

  resetCalculation: (sheetToInvert: IBasePricingSheet<Calculation>) => Array<Calculation>;
}

export interface PricingSheetParams<Calculation extends PricingCalculation> {
  calculation?: Array<Calculation>;
  currency?: string;
  quantity?: number;
}

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

    total({ category, useNetPrice, discountId } = { useNetPrice: false }) {
      const amount = this.sum({ category, discountId });
      const taxAmountForCategory = this.taxSum({ baseCategory: category, discountId });

      // Sum does not contain taxes when filtering by category, it's net in that case and gross if there is no category
      const netAmount = !category ? amount - taxAmountForCategory : amount;

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
