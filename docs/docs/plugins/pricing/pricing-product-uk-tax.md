---
sidebar_position: 34.2
title: Product UK VAT
sidebar_label: UK VAT (Product)
description: Apply UK VAT to product prices
---

# Product UK VAT

Applies UK VAT rates to product prices. Only activates for deliveries into the UK VAT area: Great Britain / Northern Ireland (GB) and the Isle of Man (IM).

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ProductUkTaxPlugin } from '@unchainedshop/plugins/pricing/product-uk-tax';

pluginRegistry.register(ProductUkTaxPlugin);
```

Or register both UK tax adapters (product + delivery) via the country preset:

```typescript
import { registerUkTaxPlugins } from '@unchainedshop/plugins/presets/countries/uk';

registerUkTaxPlugins();
```

## How It Works

1. Checks if the delivery address is in the UK VAT area (GB, IM)
2. Determines the tax category from:
   - Product tags (e.g., `uk-tax-category:zero`)
   - Delivery provider configuration (`uk-tax-category`)
   - Falls back to STANDARD (20%)
3. Resolves the rate valid at order time from the bundled era table and adds tax amounts to the pricing sheet

## Tax Categories

| Category | Current Rate | Use Case |
|----------|--------------|----------|
| STANDARD | 20% (17.5% before 2011-01-04, 15% Dec 2008 – Dec 2009) | Most goods and services |
| REDUCED | 5% (8% before Sep 1997) | Domestic fuel & power, children's car seats |
| ZERO | 0% | Most food, books, children's clothing |

## Rate Data

Rates are bundled in [`uk-tax-rates.json`](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/tax/uk-tax-rates.json) as era lists (`{ validFrom, rate }`), verified against [gov.uk](https://www.gov.uk/vat-rates) and the House of Commons Library rate history. The applicable rate follows the order date; updates land as reviewed diffs via the repository's `update-tax-rates` skill.

## Configuration

### Via Product Tags

```
uk-tax-category:reduced
uk-tax-category:zero
```

### Via Delivery Provider

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

## Net vs Gross Prices

The adapter handles both net and gross prices:

- **Net prices**: Tax is added on top (`amount * taxRate`)
- **Gross prices**: Tax is extracted from the total (`amount - amount / (1 + taxRate)`)

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.product-uk-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/product-uk-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-uk-tax/adapter.ts) |

## Related

- [Delivery UK VAT](./pricing-delivery-uk-tax.md) - UK VAT for delivery fees
- [Product EU VAT](./pricing-product-eu-tax.md) - Destination-based EU VAT
- [Product Pricing](../../extend/pricing/product-pricing.md) - Custom product pricing
