---
sidebar_position: 37.2
title: Delivery UK VAT
sidebar_label: UK VAT (Delivery)
description: Apply UK VAT to delivery fees
---

# Delivery UK VAT

Applies UK VAT rates to delivery fees. Only activates for orders with delivery addresses in the UK VAT area (GB, IM).

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { DeliveryUkTaxPlugin } from '@unchainedshop/plugins/pricing/delivery-uk-tax';

pluginRegistry.register(DeliveryUkTaxPlugin);
```

Or register all UK tax adapters (product, delivery and payment) via the country preset:

```typescript
import { registerUkTaxPlugins } from '@unchainedshop/plugins/presets/countries/uk';

registerUkTaxPlugins();
```

## How It Works

1. Checks if the delivery location is in the UK VAT area (delivery address → billing address → order or request country; a price simulated for an order uses the delivery address of the order)
2. Determines the tax category from the delivery provider's `uk-tax-category` configuration entry, falling back to STANDARD (20%)
3. Resolves the rate valid at order time from the bundled era table and applies it to the taxable delivery fee rows

Rate data and category semantics are shared with the [Product UK VAT](./pricing-product-uk-tax.md) adapter (bundled `uk-tax-rates.json`, era-based, gov.uk-verified).

## Configuration

```graphql
mutation ConfigureDeliveryProvider {
  updateDeliveryProvider(
    deliveryProviderId: "provider-id"
    deliveryProvider: {
      configuration: [
        { key: "uk-tax-category", value: "zero" }
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
| Key | `shop.unchained.pricing.delivery-uk-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/delivery-uk-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/delivery-uk-tax/adapter.ts) |

## Related

- [Payment UK VAT](./pricing-payment-uk-tax.md) - UK VAT for payment fees
- [Product UK VAT](./pricing-product-uk-tax.md) - UK VAT for products
- [Delivery EU VAT](./pricing-delivery-eu-tax.md) - EU VAT for delivery fees
