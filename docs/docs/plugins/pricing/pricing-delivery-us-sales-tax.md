---
sidebar_position: 37.3
title: Delivery US Sales Tax
sidebar_label: US Sales Tax (Delivery)
description: Apply US statewide base sales tax to delivery fees
---

# Delivery US Sales Tax

Applies the statewide base sales tax rate to delivery fees for US orders. Shares its rate data and the statewide-only approximation with the [Product US Sales Tax](./pricing-product-us-sales-tax.md) adapter.

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { DeliveryUsSalesTaxPlugin } from '@unchainedshop/plugins/pricing/delivery-us-sales-tax';

pluginRegistry.register(DeliveryUsSalesTaxPlugin);
```

Or register both US sales tax adapters (product + delivery) via the country preset:

```typescript
import { registerUsSalesTaxPlugins } from '@unchainedshop/plugins/presets/countries/us';

registerUsSalesTaxPlugins();
```

## How It Works

1. Activates only for orders with a US destination
2. Skips providers configured with `us-tax-category: exempt` — shipping taxability varies by state, so providers opt out explicitly where shipping is untaxed
3. Reads the state from the address `regionCode`; unknown states apply no tax (logged)
4. Resolves the statewide rate valid at order time from the bundled era table and applies it to the taxable delivery fee rows

## Configuration

```graphql
mutation ConfigureDeliveryProvider {
  updateDeliveryProvider(
    deliveryProviderId: "provider-id"
    deliveryProvider: {
      configuration: [
        { key: "us-tax-category", value: "exempt" }
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
| Key | `shop.unchained.pricing.delivery-us-sales-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/delivery-us-sales-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/delivery-us-sales-tax/adapter.ts) |

## Related

- [Product US Sales Tax](./pricing-product-us-sales-tax.md) - Sales tax for products
- [Delivery EU VAT](./pricing-delivery-eu-tax.md) - EU VAT for delivery fees
