import PricingSheet from '../pricing-sheet';

const OrderPricingSheetRowCategories = {
  Items: 'ITEMS',
  Discounts: 'DISCOUNTS',
  Taxes: 'TAXES',
  Delivery: 'DELIVERY',
  Payment: 'PAYMENT',
};

class OrderPricingSheet extends PricingSheet {
  addItems({ amount, meta }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategories.Items,
      amount,
      meta,
    });
  }

  addDiscounts({
    amount, discountId, meta,
  }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategories.Discounts,
      amount,
      discountId,
      meta,
    });
  }

  addTaxes({ amount, meta }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategories.Taxes,
      amount,
      meta,
    });
  }

  addDelivery({ amount, meta }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategories.Delivery,
      amount,
      meta,
    });
  }

  addPayment({ amount, meta }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategories.Payment,
      amount,
      meta,
    });
  }

  gross() {
    // tax is included 2 times
    return this.sum() - this.taxSum();
  }

  net() {
    return this.gross() - this.taxSum();
  }

  total(category) {
    if (!category) {
      return {
        amount: this.sum() - this.sum({ category: OrderPricingSheetRowCategories.Taxes }),
        currency: this.currency,
      };
    }
    return {
      amount: this.sum({ category }),
      currency: this.currency,
    };
  }

  taxSum() {
    return this.sum({
      category: OrderPricingSheetRowCategories.Taxes,
    });
  }

  itemsSum() {
    return this.sum({
      category: OrderPricingSheetRowCategories.Items,
    });
  }

  discountSum(discountId) {
    return this.sum({
      category: OrderPricingSheetRowCategories.Discounts,
      discountId,
    });
  }

  discountPrices() {
    const discountIds = this
      .getDiscountsRows()
      .map(({ discountId }) => discountId);

    return [...new Set(discountIds)].map(discountId => ({
      discountId,
      amount: this.sum({
        category: OrderPricingSheetRowCategories.Discounts,
        discountId,
      }),
      currency: this.currency,
    }));
  }

  getDiscountsRows() {
    return this.filterBy({ category: OrderPricingSheetRowCategories.Discounts });
  }

  getItemsRows() {
    return this.filterBy({ category: OrderPricingSheetRowCategories.Items });
  }

  getTaxesRows() {
    return this.filterByCategory({ category: OrderPricingSheetRowCategories.Taxes });
  }

  getDeliveryRows() {
    return this.filterByCategory({ category: OrderPricingSheetRowCategories.Delivery });
  }

  getPaymentRows() {
    return this.filterByCategory({ category: OrderPricingSheetRowCategories.Payment });
  }

  formattedSummary(formatter) {
    return {
      items: formatter(this.total(OrderPricingSheetRowCategories.Items).amount),
      taxes: formatter(this.total(OrderPricingSheetRowCategories.Taxes).amount),
      delivery: formatter(this.total(OrderPricingSheetRowCategories.Delivery).amount),
      payment: formatter(this.total(OrderPricingSheetRowCategories.Payment).amount),
      net: formatter(this.total().amount),
    };
  }
}

export { OrderPricingSheet, OrderPricingSheetRowCategories };
