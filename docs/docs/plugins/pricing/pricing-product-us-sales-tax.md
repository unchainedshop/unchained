---
sidebar_position: 34.3
title: Product US Sales Tax
sidebar_label: US Sales Tax (Product)
description: Apply US statewide base sales tax to product prices
---

# Product US Sales Tax

Applies the **statewide base** sales tax rate to product prices for the 50 US states + DC. Only activates for deliveries to the US; the state is read from the delivery address's `regionCode`.

:::warning Approximation
This adapter covers the statewide rate only (including mandatory statewide local components where a state levies them, e.g. California's 7.25%). It does **not** model county/city add-ons, per-category taxability (groceries etc.), nexus thresholds or origin-vs-destination sourcing rules. For full US sales-tax compliance, integrate a tax service (Avalara, TaxJar, …) as a custom pricing adapter.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ProductUsSalesTaxPlugin } from '@unchainedshop/plugins/pricing/product-us-sales-tax';

pluginRegistry.register(ProductUsSalesTaxPlugin);
```

Or register both US sales tax adapters (product + delivery) via the country preset:

```typescript
import { registerUsSalesTaxPlugins } from '@unchainedshop/plugins/presets/countries/us';

registerUsSalesTaxPlugins();
```

## How It Works

1. Skips products tagged `us-tax-category:exempt`
2. Resolves the destination (delivery address → billing address → order country); non-US destinations are skipped
3. Reads the state from the address `regionCode` (e.g. `CA`, `NY`); an unknown or missing state applies **no tax** (logged) rather than a made-up fallback
4. Resolves the statewide rate valid at order time from the bundled era table and adds tax amounts to the pricing sheet

## Rate Data

Statewide base rates are bundled in [`us-tax-rates.json`](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/tax/us-tax-rates.json) as era lists (`{ validFrom, rate }`), cross-checked against the state Departments of Revenue and the Tax Foundation's state rate table. Recent changes are era-modeled (e.g. Louisiana 4.45% → 5% on 2025-01-01, DC's enacted increase to 7% on 2026-10-01). The NOMAD states (NH, OR, MT, AK, DE) carry 0%. Updates land as reviewed diffs via the repository's `update-tax-rates` skill.

## Configuration

### Exempt Products

```
us-tax-category:exempt
```

## Net vs Gross Prices

US prices are conventionally **net** (tax added at checkout): store prices with `isNetPrice: true` and the tax is added on top (`amount * taxRate`). Gross rows are also handled (tax extracted).

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.product-us-sales-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/product-us-sales-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-us-sales-tax/adapter.ts) |

## Related

- [Delivery US Sales Tax](./pricing-delivery-us-sales-tax.md) - Sales tax on delivery fees
- [Product Pricing](../../extend/pricing/product-pricing.md) - Custom product pricing (e.g. tax-service integration)
