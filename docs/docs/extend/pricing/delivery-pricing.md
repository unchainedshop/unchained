---
sidebar_position: 2
sidebar_label: Delivery Pricing
title: Delivery Pricing
description: Custom delivery pricing adapters
---

# Delivery Pricing

Delivery pricing adapters calculate shipping and handling fees based on order contents, delivery method, and destination.

For conceptual overview, see [Pricing System](../../concepts/pricing-system.md).

## Creating an Adapter

Extend `DeliveryPricingAdapter` and register it with `DeliveryPricingDirector`:

```typescript
import {
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
} from '@unchainedshop/core-pricing';

class MyDeliveryPricing extends DeliveryPricingAdapter {
  static key = 'my-shop.pricing.delivery';
  static version = '1.0.0';
  static label = 'Custom Delivery Pricing';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    return provider.type === 'SHIPPING';
  }

  async calculate() {
    this.result.addItem({
      amount: 800, // 8.00 flat rate
      isTaxable: true,
      isNetPrice: true,
      category: 'DELIVERY',
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

DeliveryPricingDirector.registerAdapter(MyDeliveryPricing);
```

## Examples

### Weight-Based Shipping

```typescript
class WeightBasedShipping extends DeliveryPricingAdapter {
  static key = 'my-shop.pricing.weight-shipping';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    return provider.type === 'SHIPPING';
  }

  async calculate() {
    const { order, modules } = this.context;

    const items = await modules.orders.positions.findOrderPositions({
      orderId: order._id,
    });

    // Calculate total weight
    let totalWeight = 0;
    for (const item of items) {
      const product = await modules.products.findProduct({ productId: item.productId });
      totalWeight += (product?.warehousing?.weight || 0) * item.quantity;
    }

    // Price: base + per kg
    const basePrice = 500; // 5.00 base
    const pricePerKg = 200; // 2.00 per kg

    this.result.addItem({
      amount: basePrice + Math.round(totalWeight * pricePerKg),
      isTaxable: true,
      isNetPrice: true,
      category: 'DELIVERY',
      meta: { weight: totalWeight, adapter: this.constructor.key },
    });

    return super.calculate();
  }
}
```

### Zone-Based Pricing

```typescript
class ZoneBasedShipping extends DeliveryPricingAdapter {
  static key = 'my-shop.pricing.zone-shipping';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    return provider.type === 'SHIPPING';
  }

  async calculate() {
    const { order } = this.context;
    const countryCode = order.delivery?.address?.countryCode;

    const zoneRates = {
      CH: 800,    // 8.00 domestic
      DE: 1500,   // 15.00 EU neighbor
      AT: 1500,
      FR: 1500,
      IT: 1500,
      default: 2500, // 25.00 international
    };

    const amount = zoneRates[countryCode] || zoneRates.default;

    this.result.addItem({
      amount,
      isTaxable: true,
      isNetPrice: true,
      category: 'DELIVERY',
      meta: { zone: countryCode, adapter: this.constructor.key },
    });

    return super.calculate();
  }
}
```

### Free Shipping Threshold

```typescript
class FreeShippingThreshold extends DeliveryPricingAdapter {
  static key = 'my-shop.pricing.free-shipping';
  static orderIndex = 10; // After base shipping

  async calculate() {
    const { order, modules } = this.context;
    const threshold = 10000; // Free shipping over 100.00

    // Calculate product total
    const items = await modules.orders.positions.findOrderPositions({
      orderId: order._id,
    });
    const productTotal = items.reduce((sum, item) => {
      return sum + (item.calculation?.find(c => c.category === 'BASE')?.amount || 0);
    }, 0);

    if (productTotal >= threshold) {
      const deliveryTotal = this.calculation.sum({ category: 'DELIVERY' });

      if (deliveryTotal > 0) {
        this.result.addItem({
          amount: -deliveryTotal,
          isTaxable: true,
          isNetPrice: true,
          category: 'DISCOUNT',
          meta: { type: 'free-shipping', threshold, adapter: this.constructor.key },
        });
      }
    }

    return super.calculate();
  }
}
```

### Express Shipping Option

```typescript
class ExpressShipping extends DeliveryPricingAdapter {
  static key = 'my-shop.pricing.express';
  static orderIndex = 0;

  static isActivatedFor({ provider }) {
    // Only for express delivery provider
    return provider.adapterKey === 'my-shop.delivery.express';
  }

  async calculate() {
    const { order } = this.context;

    // Express: 2x standard rate
    const standardRate = 800;
    const expressMultiplier = 2;

    this.result.addItem({
      amount: standardRate * expressMultiplier,
      isTaxable: true,
      isNetPrice: true,
      category: 'DELIVERY',
      meta: { type: 'express', adapter: this.constructor.key },
    });

    return super.calculate();
  }
}
```

## Context Properties

Available in `this.context`:

| Property | Description |
|----------|-------------|
| `provider` | The delivery provider |
| `order` | The current order |
| `modules` | Access to all modules |
| `currency` | Currency code |

## Related

- [Pricing System](../../concepts/pricing-system.md) - Conceptual overview
- [Product Pricing](./product-pricing.md) - Product prices
- [Payment Pricing](./payment-pricing.md) - Payment fees
- [Delivery Plugins](../order-fulfilment/fulfilment-plugins/delivery.md) - Delivery adapters
