---
sidebar_position: 1
sidebar_label: Product Pricing
title: Product Pricing
description: Custom product pricing adapters
---

# Product Pricing

Product pricing adapters calculate prices when products are queried or added to cart. Use them to implement taxes, discounts, rounding, and currency conversion.

For conceptual overview, see [Pricing System](../../concepts/pricing-system.md).

## Creating an Adapter

Extend `ProductPricingAdapter` and register it with `ProductPricingDirector`:

```typescript
import {
  ProductPricingAdapter,
  ProductPricingDirector,
} from '@unchainedshop/core-pricing';

class MyProductPricing extends ProductPricingAdapter {
  static key = 'my-shop.pricing.custom';
  static version = '1.0.0';
  static label = 'Custom Product Pricing';
  static orderIndex = 0;

  static isActivatedFor({ product, currencyCode }) {
    return true; // Activate for all products
  }

  async calculate() {
    const { product, quantity, currencyCode } = this.context;

    this.result.addItem({
      amount: 1000, // 10.00 in cents
      isTaxable: true,
      isNetPrice: true,
      category: 'BASE',
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(MyProductPricing);
```

## Examples

### Tax Calculation

```typescript
class SwissTaxAdapter extends ProductPricingAdapter {
  static key = 'my-shop.pricing.swiss-tax';
  static orderIndex = 20; // After base price and discounts

  static isActivatedFor({ country }) {
    return country === 'CH';
  }

  async calculate() {
    const taxRate = 0.081; // 8.1% Swiss VAT
    const taxableAmount = this.calculation.sum({ isTaxable: true });

    if (taxableAmount > 0) {
      this.result.addItem({
        amount: Math.round(taxableAmount * taxRate),
        isTaxable: false,
        isNetPrice: false,
        category: 'TAX',
        meta: { rate: taxRate, adapter: this.constructor.key },
      });
    }

    return super.calculate();
  }
}
```

### Bulk Discount

```typescript
class BulkDiscountAdapter extends ProductPricingAdapter {
  static key = 'my-shop.pricing.bulk-discount';
  static orderIndex = 10; // After base price, before tax

  async calculate() {
    const { quantity } = this.context;

    if (quantity >= 10) {
      const baseTotal = this.calculation.sum({ category: 'BASE' });
      const discountRate = 0.1; // 10% off

      this.result.addItem({
        amount: -Math.round(baseTotal * discountRate),
        isTaxable: true,
        isNetPrice: true,
        category: 'DISCOUNT',
        meta: { type: 'bulk', rate: discountRate },
      });
    }

    return super.calculate();
  }
}
```

### Price Rounding

```typescript
class PriceRoundingAdapter extends ProductPricingAdapter {
  static key = 'my-shop.pricing.rounding';
  static orderIndex = 30; // Run last

  async calculate() {
    const { calculation = [] } = this;

    if (calculation.length) {
      const [basePrice] = calculation;
      const rounded = this.roundToNext(basePrice.amount, 50);

      this.resetCalculation();
      this.result.addItem({
        amount: rounded,
        isTaxable: basePrice.isTaxable,
        isNetPrice: basePrice.isNetPrice,
        meta: { adapter: this.constructor.key },
      });
    }

    return super.calculate();
  }

  roundToNext(value: number, precision: number) {
    const remainder = value % precision;
    return remainder === 0 ? value : value + (precision - remainder);
  }
}
```

### Currency Conversion

```typescript
class CurrencyConversionAdapter extends ProductPricingAdapter {
  static key = 'my-shop.pricing.currency';
  static orderIndex = 1;

  async calculate() {
    const { currencyCode, baseCurrencyCode } = this.context;

    if (currencyCode !== baseCurrencyCode) {
      const rate = await this.getExchangeRate(baseCurrencyCode, currencyCode);

      for (const item of this.calculation) {
        item.amount = Math.round(item.amount * rate);
      }
    }

    return super.calculate();
  }

  async getExchangeRate(from: string, to: string) {
    // Fetch from your exchange rate service
    return 1.1;
  }
}
```

## Adapter Properties

| Property | Type | Description |
|----------|------|-------------|
| `key` | string | Unique identifier |
| `version` | string | Version for tracking |
| `label` | string | Human-readable name |
| `orderIndex` | number | Execution order (lower = earlier) |

## Context Properties

Available in `this.context`:

| Property | Description |
|----------|-------------|
| `product` | The product being priced |
| `quantity` | Quantity requested |
| `currencyCode` | Target currency |
| `country` | Country code |

## Related

- [Pricing System](../../concepts/pricing-system.md) - Conceptual overview
- [Delivery Pricing](./delivery-pricing.md) - Shipping fees
- [Payment Pricing](./payment-pricing.md) - Payment fees
- [Order Discounts](./order-discounts.md) - Order-level discounts
