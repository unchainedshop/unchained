type BaseCalculation<Category> = {
  category: Category;
  amount: number;
  meta?: any;
};

export type PricingSheetParams<Calculation> = {
  calculation?: Array<Calculation>;
  currency?: string;
  quantity?: number;
};
export const BasePricingSheet = <
  Category,
  Calculation extends BaseCalculation<Category>
>({
  calculation,
  currency,
  quantity,
}: PricingSheetParams<Calculation>) => {
  const pricingSheet = {
    calculation,
    currency,
    quantity,
    sum(filterOptions?: Partial<Calculation>) {
      return pricingSheet
        .filterBy(filterOptions)
        .reduce(
          (sum: number, calculationRow: Calculation) =>
            sum + calculationRow.amount,
          0
        );
    },

    taxSum(): number {
      return 0;
    },

    filterBy(options?: Partial<Calculation>): Array<Calculation> {
      return Object.keys(options || {}).reduce(
        (oldCalculation, optionKey) =>
          oldCalculation.filter(
            (row: Calculation) =>
              options[optionKey] === undefined ||
              row[optionKey] === options[optionKey]
          ),
        calculation
      );
    },

    getRawPricingSheet(): Array<Calculation> {
      return calculation;
    },

    gross(): number {
      return pricingSheet.sum();
    },

    net(): number {
      return pricingSheet.gross() - pricingSheet.taxSum();
    },

    total(
      category: Category,
      useNetPrice: boolean = false
    ): { amount: number; currency: string } {
      if (!category) {
        return {
          amount: Math.round(
            useNetPrice ? pricingSheet.net() : pricingSheet.gross()
          ),
          currency,
        };
      }
      return {
        amount: Math.round(this.sum({ category } as Calculation)),
        currency,
      };
    },

    isValid(): boolean {
      return calculation.length > 0;
    },
  };

  return pricingSheet;
};
