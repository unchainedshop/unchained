---
sidebar_position: 37
title: Delivery Swiss Tax
sidebar_label: Swiss Tax (Delivery)
description: Apply Swiss VAT to delivery fees
---

# Delivery Swiss Tax

Applies Swiss VAT rates to delivery fees. Only activates for orders with delivery addresses in Switzerland (CH) or Liechtenstein (LI).

:::info Included in All Preset
Registered automatically by `registerAllPlugins()` (via `registerSwissTaxPlugins()` from `@unchainedshop/plugins/presets/countries/ch`).
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { DeliverySwissTaxPlugin } from '@unchainedshop/plugins/pricing/delivery-swiss-tax';

pluginRegistry.register(DeliverySwissTaxPlugin);
```

## How It Works

1. Checks if the order has a delivery and address in CH/LI
2. Resolves the tax category from delivery provider configuration
3. Falls back to DEFAULT rate (8.1%) if not specified
4. Calculates and adds tax to the delivery fee

## Tax Categories

| Category | 2024+ | 2018–2023 | 2011–2017 | 2001–2010 |
|----------|-------|-----------|-----------|-----------|
| DEFAULT | 8.1% | 7.7% | 8.0% | 7.6% |
| REDUCED | 2.6% | 2.5% | 2.5% | 2.4% |
| SPECIAL | 3.8% | 3.7% | 3.8% | 3.6% |

Rate data is shared with the [Product Swiss Tax](./pricing-product-swiss-tax.md) adapter (bundled `ch-tax-rates.json`, era-based, ESTV-verified; the rate follows the order date).

## Configuration

Set the tax category on the delivery provider:

```graphql
mutation CreateDeliveryProvider {
  createDeliveryProvider(
    deliveryProvider: {
      type: SHIPPING
      adapterKey: "shop.unchained.post"
    }
  ) {
    _id
  }
}

mutation ConfigureDeliveryProvider {
  updateDeliveryProvider(
    deliveryProviderId: "provider-id"
    deliveryProvider: {
      configuration: [
        { key: "swiss-tax-category", value: "default" }
      ]
    }
  ) {
    _id
  }
}
```

## Activation Conditions

The adapter only activates when:
- The order exists
- Order delivery is set
- Delivery address is in Switzerland or Liechtenstein

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.delivery-swiss-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/delivery-swiss-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/delivery-swiss-tax/adapter.ts) |

## Related

- [Product Swiss Tax](./pricing-product-swiss-tax.md) - Swiss VAT for products
- [Free Delivery](./pricing-delivery-free.md) - Zero-cost delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Custom delivery pricing
