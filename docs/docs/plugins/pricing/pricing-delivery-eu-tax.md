---
sidebar_position: 37.1
title: Delivery EU VAT
sidebar_label: EU VAT (Delivery)
description: Apply destination-based EU VAT to delivery fees
---

# Delivery EU VAT

Applies destination-based EU VAT to delivery fees. Only activates for orders whose resolved destination is an EU member state.

## Installation

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { DeliveryEuTaxPlugin } from '@unchainedshop/plugins/pricing/delivery-eu-tax';

pluginRegistry.register(DeliveryEuTaxPlugin);
```

## How It Works

1. Resolves the destination country (delivery address → billing address → order country)
2. Determines the tax category from the delivery provider's `eu-tax-category` configuration entry, falling back to the destination country's **standard** rate
3. Resolves the rate valid at order time from the bundled per-country era tables and applies it to the taxable delivery fee rows

Rate data and category semantics are shared with the [Product EU VAT](./pricing-product-eu-tax.md) adapter (bundled `eu-tax-rates.json`, era-based, EC-verified).

## Configuration

```graphql
mutation ConfigureDeliveryProvider {
  updateDeliveryProvider(
    deliveryProviderId: "provider-id"
    deliveryProvider: {
      configuration: [
        { key: "eu-tax-category", value: "reduced" }
      ]
    }
  ) {
    _id
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.delivery-eu-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/delivery-eu-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/delivery-eu-tax/adapter.ts) |

## Related

- [Product EU VAT](./pricing-product-eu-tax.md) - EU VAT for products
- [Delivery Swiss Tax](./pricing-delivery-swiss-tax.md) - Swiss VAT for delivery fees
