---
sidebar_position: 3
sidebar_label: Payment Pricing
title: Payment Pricing
description: Custom payment pricing adapters
---

# Payment Pricing

Payment pricing adapters calculate fees for different payment methods, such as credit card processing fees or invoice handling charges.

For conceptual overview, see [Pricing System](../../concepts/pricing-system.md).

## Creating an Adapter

Extend `PaymentPricingAdapter` and register it with `PaymentPricingDirector`:

```typescript
import {
  PaymentPricingAdapter,
  PaymentPricingDirector,
} from '@unchainedshop/core-pricing';

class MyPaymentPricing extends PaymentPricingAdapter {
  static key = 'my-shop.pricing.payment';
  static version = '1.0.0';
  static label = 'Custom Payment Pricing';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    return true; // Activate for all payment providers
  }

  async calculate() {
    this.result.addItem({
      amount: 0, // No fee
      isTaxable: false,
      isNetPrice: true,
      category: 'PAYMENT',
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

PaymentPricingDirector.registerAdapter(MyPaymentPricing);
```

## Examples

### Credit Card Fee

```typescript
class CardFeeAdapter extends PaymentPricingAdapter {
  static key = 'my-shop.pricing.card-fee';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    return provider.type === 'CARD' || provider.type === 'GENERIC';
  }

  async calculate() {
    const { order } = this.context;
    const orderTotal = order.pricing().total().amount;

    // 2.9% + 30 cents (typical card processing fee)
    const fee = Math.round(orderTotal * 0.029 + 30);

    this.result.addItem({
      amount: fee,
      isTaxable: false,
      isNetPrice: true,
      category: 'PAYMENT',
      meta: { rate: 0.029, fixed: 30, adapter: this.constructor.key },
    });

    return super.calculate();
  }
}
```

### Invoice Fee

```typescript
class InvoiceFeeAdapter extends PaymentPricingAdapter {
  static key = 'my-shop.pricing.invoice-fee';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    return provider.type === 'INVOICE';
  }

  async calculate() {
    // Flat fee for invoice handling
    this.result.addItem({
      amount: 500, // 5.00 invoice fee
      isTaxable: true,
      isNetPrice: true,
      category: 'PAYMENT',
      meta: { type: 'invoice', adapter: this.constructor.key },
    });

    return super.calculate();
  }
}
```

### Discount for Bank Transfer

```typescript
class BankTransferDiscountAdapter extends PaymentPricingAdapter {
  static key = 'my-shop.pricing.bank-discount';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    return provider.adapterKey === 'my-shop.payment.bank-transfer';
  }

  async calculate() {
    const { order } = this.context;
    const orderTotal = order.pricing().total().amount;

    // 2% discount for bank transfer (no card fees)
    const discount = Math.round(orderTotal * 0.02);

    this.result.addItem({
      amount: -discount,
      isTaxable: true,
      isNetPrice: true,
      category: 'DISCOUNT',
      meta: { type: 'bank-transfer-discount', rate: 0.02 },
    });

    return super.calculate();
  }
}
```

### Tiered Processing Fees

```typescript
class TieredFeeAdapter extends PaymentPricingAdapter {
  static key = 'my-shop.pricing.tiered-fee';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    return provider.type === 'CARD';
  }

  async calculate() {
    const { order } = this.context;
    const orderTotal = order.pricing().total().amount;

    // Tiered rates based on order value
    let rate: number;
    if (orderTotal >= 50000) {
      rate = 0.019; // 1.9% for orders >= 500
    } else if (orderTotal >= 10000) {
      rate = 0.025; // 2.5% for orders >= 100
    } else {
      rate = 0.029; // 2.9% for smaller orders
    }

    const fee = Math.round(orderTotal * rate + 30);

    this.result.addItem({
      amount: fee,
      isTaxable: false,
      isNetPrice: true,
      category: 'PAYMENT',
      meta: { rate, orderTotal, adapter: this.constructor.key },
    });

    return super.calculate();
  }
}
```

## Context Properties

Available in `this.context`:

| Property | Description |
|----------|-------------|
| `provider` | The payment provider |
| `order` | The current order |
| `modules` | Access to all modules |
| `currency` | Currency code |

## Related

- [Pricing System](../../concepts/pricing-system.md) - Conceptual overview
- [Product Pricing](./product-pricing.md) - Product prices
- [Delivery Pricing](./delivery-pricing.md) - Shipping fees
- [Payment Plugins](../order-fulfilment/fulfilment-plugins/payment.md) - Payment adapters
