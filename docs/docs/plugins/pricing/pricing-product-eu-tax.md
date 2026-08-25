---
sidebar_position: 34.1
title: Product EU VAT
sidebar_label: EU VAT (Product)
description: Apply destination-based EU VAT to product prices
---

# Product EU VAT

Applies destination-based EU VAT to product prices for all 27 member states. Only activates when the resolved delivery destination is an EU member state.

## Installation

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ProductEuTaxPlugin } from '@unchainedshop/plugins/pricing/product-eu-tax';

pluginRegistry.register(ProductEuTaxPlugin);
```

## How It Works

1. Resolves the destination country (delivery address → billing address → order country)
2. Skips orders whose destination is not an EU member state
3. Determines the tax category from:
   - Product tags (e.g., `eu-tax-category:reduced`)
   - Delivery provider configuration (`eu-tax-category`)
   - Falls back to the destination country's **standard** rate
4. Resolves the rate valid at order time from the bundled per-country era tables and adds tax amounts to the pricing sheet

## Tax Categories

Category names follow the EU VAT Directive. Every country has `standard`; the other categories exist only where a member state uses them:

| Category | Example (DE) | Example (FR) |
|----------|--------------|--------------|
| `standard` | 19% | 20% |
| `reduced` | 7% | 5.5% |
| `reduced2` | — | 10% |
| `super_reduced` | — | 2.1% |
| `parking` | — | — |

Requesting a category a country does not have falls back to that country's standard rate — never silently to zero. Greece resolves under both `GR` (ISO) and `EL` (EU convention).

## Rate Data

Rates for all 27 member states are bundled in [`eu-tax-rates.json`](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/tax/eu-tax-rates.json) as era lists (`{ validFrom, rate }`), verified against the [European Commission's VAT database](https://ec.europa.eu/taxation_customs/tedb/#/vat-search). The applicable rate follows the order date, so historical recalculations stay correct (including temporary cuts such as Germany's 16% in H2 2020). Rates are never fetched at runtime — updates land as reviewed diffs via the repository's `update-tax-rates` skill.

## Configuration

### Via Product Tags

```
eu-tax-category:reduced
eu-tax-category:super_reduced
```

### Via Delivery Provider

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

## Net vs Gross Prices

The adapter handles both net and gross prices:

- **Net prices**: Tax is added on top (`amount * taxRate`)
- **Gross prices**: Tax is extracted from the total (`amount - amount / (1 + taxRate)`)

## Scope

Cross-border regimes are intentionally out of scope: OSS registration thresholds, B2B reverse charge and exemptions should be modeled with dedicated adapters if needed.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.product-eu-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/product-eu-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-eu-tax/adapter.ts) |

## Related

- [Delivery EU VAT](./pricing-delivery-eu-tax.md) - EU VAT for delivery fees
- [Product Swiss Tax](./pricing-product-swiss-tax.md) - Swiss VAT for products
- [Product Pricing](../../extend/pricing/product-pricing.md) - Custom product pricing
