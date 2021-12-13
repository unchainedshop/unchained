interface PricingOptions {}
type BaseCalculation<Category> = {
  category: Category;
  amount: number;
  meta?: any;
};

export class PricingSheet<
  Category,
  Calculation extends BaseCalculation<Category>
> {
  public calculation: Array<Calculation> = [];
  public currency: string;
  public quantity: number;

  constructor({
    calculation,
    currency,
    quantity,
  }: {
    calculation?: Array<Calculation>;
    currency?: string;
    quantity?: number;
  }) {
    this.calculation = calculation || [];
    this.currency = currency;
    this.quantity = quantity;
  }

  sum(filterOptions?: Partial<Calculation>) {
    return this.filterBy(filterOptions).reduce(
      (sum, calculationRow) => sum + calculationRow.amount,
      0
    );
  }

  taxSum(): number {
    return 0;
  }

  filterBy(options?: Partial<Calculation>): Array<Calculation> {
    return Object.keys(options || {}).reduce(
      (oldCalculation, optionKey) =>
        oldCalculation.filter(
          (row) =>
            options[optionKey] === undefined ||
            row[optionKey] === options[optionKey]
        ),
      this.calculation
    );
  }

  getRawPricingSheet(): Array<Calculation> {
    return this.calculation;
  }

  gross(): number {
    return this.sum();
  }

  net(): number {
    return this.gross() - this.taxSum();
  }

  total(
    category: Category,
    useNetPrice: boolean = false
  ): { amount: number; currency: string } {
    if (!category) {
      return {
        amount: Math.round(useNetPrice ? this.net() : this.gross()),
        currency: this.currency,
      };
    }
    return {
      amount: Math.round(this.sum({ category } as Calculation)),
      currency: this.currency,
    };
  }

  isValid(): boolean {
    return this.calculation.length > 0;
  }
}
