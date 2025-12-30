---
sidebar_position: 32
title: Product Rate Conversion
sidebar_label: Rate Conversion
description: Currency conversion for product prices
---

# Product Rate Conversion

Converts product prices between currencies using configured exchange rates. Only activates when no direct price exists for the target currency.

## Installation

```typescript
import '@unchainedshop/plugins/pricing/product-price-rateconversion';
```

## How It Works

1. Checks if a price already exists in the calculation (skips if yes)
2. Looks up a price in any available currency for the product
3. Fetches the exchange rate between source and target currencies
4. Converts and adds the price to the calculation

## Prerequisites

- Exchange rates must be configured in the database
- Both source and target currencies must be active

## Setting Exchange Rates

Exchange rates are managed through the `products.prices.updateRates` module method. Use one of the built-in worker plugins to update rates automatically:

- [Update ECB Rates](../workers/worker-update-ecb-rates.md) - European Central Bank rates
- [Update Coinbase Rates](../workers/worker-update-coinbase-rates.md) - Cryptocurrency rates

Or update rates programmatically:

```typescript
await unchainedAPI.modules.products.prices.updateRates([
  {
    baseCurrency: 'CHF',
    quoteCurrency: 'EUR',
    rate: 0.95,
    timestamp: new Date(),
  },
]);
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.rate-conversion` |
| Version | `1.0.0` |
| Order Index | `10` |
| Source | [pricing/product-price-rateconversion.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-price-rateconversion.ts) |

## Related

- [Product Catalog Price](./pricing-product-catalog-price.md) - Base product pricing
- [Multi-Currency Setup](../../guides/multi-currency-setup.md) - Currency configuration guide
