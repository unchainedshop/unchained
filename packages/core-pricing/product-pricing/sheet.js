import PricingSheet from '../pricing-sheet';

const ProductPricingSheetRowCategories = {
  Item: 'ITEM',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
};

class ProductPricingSheet extends PricingSheet {
  constructor({ quantity, ...rest }) {
    super(rest);
    this.quantity = quantity;
  }

  addItem({
    amount, isTaxable, isNetPrice, meta,
  }) {
    this.calculation.push({
      category: ProductPricingSheetRowCategories.Item,
      amount,
      isTaxable,
      isNetPrice,
      meta,
    });
  }

  addDiscount({
    amount, isTaxable, discountId, meta,
  }) {
    this.calculation.push({
      category: ProductPricingSheetRowCategories.Discount,
      amount,
      isTaxable,
      discountId,
      meta,
    });
  }

  addTax({ amount, rate, meta }) {
    this.calculation.push({
      category: ProductPricingSheetRowCategories.Tax,
      amount,
      rate,
      meta,
    });
  }

  taxSum() {
    return this.sum({
      category: ProductPricingSheetRowCategories.Tax,
    });
  }

  itemSum() {
    return this.sum({
      category: ProductPricingSheetRowCategories.Item,
    });
  }

  discountSum(discountId) {
    return this.sum({
      category: ProductPricingSheetRowCategories.Discount,
      discountId,
    });
  }

  unitPrice({ useNetPrice = false } = {}) {
    const amount = useNetPrice ? this.net() : this.gross();
    return {
      amount: amount / this.quantity,
      currency: this.currency,
    };
  }

  discountPrices() {
    const discountIds = this
      .getDiscountRows()
      .map(({ discountId }) => discountId);

    return [...new Set(discountIds)].map(discountId => ({
      discountId,
      amount: this.sum({
        category: ProductPricingSheetRowCategories.Discount,
        discountId,
      }),
      currency: this.currency,
    }));
  }

  getItemRows() {
    return this.filterBy({ category: ProductPricingSheetRowCategories.Item });
  }

  getDiscountRows() {
    return this.filterBy({ category: ProductPricingSheetRowCategories.Discount });
  }

  getTaxRows() {
    return this.filterBy({ category: ProductPricingSheetRowCategories.Tax });
  }
}

export { ProductPricingSheet, ProductPricingSheetRowCategories };
