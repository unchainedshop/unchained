---
sidebar_position: 34
title: Product Swiss Tax
sidebar_label: Swiss Tax (Product)
description: Apply Swiss VAT to product prices
---

# Product Swiss Tax

Applies Swiss VAT rates to product prices. Only activates for deliveries to Switzerland (CH) or Liechtenstein (LI).

## Installation

```typescript
import '@unchainedshop/plugins/pricing/product-swiss-tax';
```

## How It Works

1. Checks if the delivery address is in Switzerland or Liechtenstein
2. Determines the tax category from:
   - Product tags (e.g., `swiss-tax-category:reduced`)
   - Delivery provider configuration
   - Falls back to DEFAULT (8.1%)
3. Calculates and adds tax amounts to the pricing sheet

## Tax Categories

| Category | Rate (2024+) | Rate (pre-2024) | Use Case |
|----------|--------------|-----------------|----------|
| DEFAULT | 8.1% | 7.7% | Standard goods and services |
| REDUCED | 2.6% | 2.5% | Food, books, newspapers, medicines |
| SPECIAL | 3.8% | 3.7% | Accommodation services |

## Configuration

### Via Product Tags

Add a tag to the product:

```
swiss-tax-category:reduced
swiss-tax-category:special
```

### Via Delivery Provider

Configure the delivery provider:

```graphql
mutation CreateDeliveryProvider {
  createDeliveryProvider(
    deliveryProvider: {
      type: SHIPPING
      adapterKey: "shop.unchained.post"
      configuration: [
        { key: "swiss-tax-category", value: "reduced" }
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
| Key | `shop.unchained.pricing.product-swiss-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/product-swiss-tax.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-swiss-tax.ts) |

## Related

- [Delivery Swiss Tax](./pricing-delivery-swiss-tax.md) - Swiss VAT for delivery fees
- [Product Pricing](../../extend/pricing/product-pricing.md) - Custom product pricing
