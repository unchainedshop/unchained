export default class PricingSheet {
  constructor({ calculation, currency }) {
    this.calculation = calculation || [];
    this.currency = currency;
  }

  sum(filterOptions) {
    return this.filterBy(filterOptions).reduce(
      (sum, calculationRow) => sum + calculationRow.amount,
      0
    );
  }

  filterBy(options) {
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

  getRawPricingSheet() {
    return this.calculation;
  }

  gross() {
    return this.sum();
  }

  net() {
    return this.sum() - this.taxSum();
  }

  total(category) {
    return {
      amount: this.sum({ category }),
      currency: this.currency,
    };
  }

  isValid() {
    return this.calculation.length > 0;
  }
}
