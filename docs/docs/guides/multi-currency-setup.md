---
sidebar_position: 7
title: Multi-Currency Setup
sidebar_label: Multi-Currency Setup
description: Configure multiple currencies in Unchained Engine
---

# Multi-Currency Setup

This guide covers configuring multiple currencies and handling currency conversion in Unchained Engine.

## Configuration

### 1. Set Up Currencies

Create currencies via GraphQL:

```graphql
mutation CreateCurrency {
  createCurrency(currency: {
    isoCode: "EUR"
  }) {
    _id
    isoCode
    isActive
  }
}
```

Or seed them at startup (`create` uppercases the ISO code):

```typescript
// In your boot script, after startPlatform()
for (const isoCode of ['CHF', 'EUR', 'USD']) {
  await platform.unchainedAPI.modules.currencies.create({ isoCode, isActive: true });
}
```

### 2. Link Currencies to Countries

Each country carries a `defaultCurrencyCode`:

```graphql
mutation UpdateCountry {
  updateCountry(countryId: "country-id", country: {
    isoCode: "CH"
    defaultCurrencyCode: "CHF"
  }) {
    _id
    defaultCurrency {
      isoCode
    }
  }
}
```

### 3. How the Request Currency Is Resolved

There is no currency environment variable that sets the request currency. Per request (`packages/api/src/locale-context.ts`):

1. The locale (and thus the country) is resolved from the `Accept-Language` and `x-shop-country` headers — see [Multi-Language Setup](./multi-language-setup#server-side-language-resolution).
2. The resolved country's `defaultCurrencyCode` becomes the request currency if that currency is active (`resolveBestCurrency`).
3. Otherwise the fallback applies: the currency from `UNCHAINED_CURRENCY` (default `CHF`) if active, else the first active currency.

Carts are created with the currency resolved for the request; `simulatedPrice(currencyCode: ...)` lets the storefront query any currency explicitly.

## Product Pricing

### Set Prices Per Currency

Catalog prices are stored per currency/country pair:

```graphql
mutation SetMultiCurrencyPrices {
  updateProductCommerce(productId: "product-123", commerce: {
    pricing: [
      { currencyCode: "CHF", countryCode: "CH", amount: 4900, isTaxable: true, isNetPrice: true }
      { currencyCode: "EUR", countryCode: "DE", amount: 4500, isTaxable: true, isNetPrice: true }
      { currencyCode: "USD", countryCode: "US", amount: 5200, isTaxable: true, isNetPrice: true }
    ]
  }) {
    _id
  }
}
```

Amounts are integers in the currency's smallest unit (cents).

## Exchange Rates

For currencies without an explicit catalog price, Unchained can convert from a stored price using exchange rates in the `product_rates` collection.

### Rates API

```typescript
const { modules } = platform.unchainedAPI;

// Insert/update rates. Rates carry an explicit validity window.
const timestamp = new Date();
await modules.products.prices.rates.updateRates([
  {
    baseCurrency: 'CHF',
    quoteCurrency: 'EUR',
    rate: 0.92,
    timestamp,
    expiresAt: new Date(timestamp.getTime() + 60 * 60 * 1000), // valid 1 hour
  },
]);

// Get the most recent valid rate for a currency pair
const rateData = await modules.products.prices.rates.getRate(
  { isoCode: 'CHF' }, // base currency ({ isoCode, decimals? })
  { isoCode: 'EUR' }, // quote currency
); // -> { rate: number, expiresAt?: Date } | null
```

Only rates whose `timestamp`–`expiresAt` window covers the reference date (default: now) are returned. Inverse pairs are handled automatically — if you store `CHF/EUR`, querying `EUR/CHF` returns the inverse, adjusted for the currencies' `decimals`.

### Rate Conversion Plugin

The built-in `shop.unchained.pricing.rate-conversion` product pricing adapter consumes these rates. It only runs when no other adapter has produced a price for the requested currency, and then converts the product's stored catalog price using the stored rate. It is registered by the `crypto` preset (and therefore also by `registerAllPlugins`):

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ProductPriceRateConversionPlugin } from '@unchainedshop/plugins/pricing/product-price-rateconversion';

pluginRegistry.register(ProductPriceRateConversionPlugin);
```

For bespoke conversion logic, write a custom adapter with `registerProductPricing` — see [Custom Pricing](./custom-pricing).

### Built-In Rate Updater Workers

The `crypto` preset (included in `registerAllPlugins`) registers two worker plugins that keep rates fresh and auto-schedule themselves:

| Plugin | Work type | Schedule | Source | Rate validity |
|--------|-----------|----------|--------|---------------|
| `UpdateCoinbaseRatesPlugin` | `UPDATE_COINBASE_RATES` | every minute | Coinbase (base = fallback currency) | 5 minutes |
| `UpdateECBRatesPlugin` | `UPDATE_ECB_RATES` | daily | European Central Bank (base = EUR, requires the `EUR` currency to exist — active or not) | 24 hours |

Both only store rates for currencies that exist in your system.

### Custom Exchange Rate Provider

To pull rates from another source, register a worker plugin that writes rates via the module API:

```typescript
import {
  WorkerAdapter,
  WorkerDirector,
  pluginRegistry,
  schedule,
  type IWorkerAdapter,
} from '@unchainedshop/core';

const UpdateFiatRates: IWorkerAdapter<unknown, { ratesUpdated: number }> = {
  ...WorkerAdapter,
  key: 'com.example.worker.update-fiat-rates',
  label: 'Update fiat exchange rates',
  version: '1.0.0',
  type: 'UPDATE_FIAT_RATES',

  doWork: async (input, unchainedAPI) => {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/CHF');
    const data = await response.json();

    const timestamp = new Date();
    const expiresAt = new Date(timestamp.getTime() + 60 * 60 * 1000);
    const rates = Object.entries(data.rates as Record<string, number>).map(
      ([quoteCurrency, rate]) => ({
        baseCurrency: 'CHF',
        quoteCurrency,
        rate,
        timestamp,
        expiresAt,
      }),
    );

    const success = await unchainedAPI.modules.products.prices.rates.updateRates(rates);
    return { success, result: { ratesUpdated: rates.length } };
  },
};

pluginRegistry.register({
  key: UpdateFiatRates.key,
  label: UpdateFiatRates.label,
  version: UpdateFiatRates.version,
  adapters: [UpdateFiatRates],
  onRegister: () => {
    WorkerDirector.configureAutoscheduling({
      type: UpdateFiatRates.type,
      schedule: schedule.parse.cron('0 * * * *'), // hourly
    });
  },
});
```

## Querying Prices

### Get Price in Specific Currency

```graphql
query ProductPrice($productId: ID!, $currency: String!) {
  product(productId: $productId) {
    ... on SimpleProduct {
      simulatedPrice(currencyCode: $currency, quantity: 1) {
        amount
        currencyCode
        isTaxable
        isNetPrice
      }
    }
  }
}
```

### Get Prices in Multiple Currencies

```graphql
query ProductMultiPrices($productId: ID!) {
  product(productId: $productId) {
    ... on SimpleProduct {
      chfPrice: simulatedPrice(currencyCode: "CHF") {
        amount
        currencyCode
      }
      eurPrice: simulatedPrice(currencyCode: "EUR") {
        amount
        currencyCode
      }
    }
  }
}
```

### Cart Currency

```graphql
query CartCurrency {
  me {
    cart {
      currency {
        isoCode
      }
      country {
        isoCode
      }
      total {
        amount
        currencyCode
      }
    }
  }
}
```

## Cryptocurrency Support

Currencies can carry a token contract address and custom decimals:

```graphql
mutation CreateCryptoCurrency {
  createCurrency(currency: {
    isoCode: "ETH"
    contractAddress: "0x0000000000000000000000000000000000000000"
    decimals: 18
  }) {
    _id
    isoCode
    contractAddress
    decimals
  }
}
```

The rate conversion described above works for crypto pairs too — the Coinbase worker delivers crypto rates, and `decimals` is respected when normalizing rates. Payment via cryptocurrencies is handled by the Cryptopay plugin in the `crypto` preset.

## Best Practices

- **Store amounts as integers** in the smallest unit (`4999` = 49.99 CHF) — never floats. For display, divide by `10^decimals` (2 by default) and format with `Intl.NumberFormat`.
- **Round consistently** — `Math.round()` after conversion, as the built-in rate conversion adapter does.
- **Give rates a realistic validity window** — expired rates are ignored, so a stale feed makes conversion-priced products unavailable rather than mispriced.
- **Prefer explicit catalog prices** for your main currencies; use rate conversion for the long tail.

## Related

- [Currencies Module](../platform-configuration/modules/currencies) - Currency configuration
- [Pricing System](../concepts/pricing-system) - Pricing architecture
- [Custom Pricing](./custom-pricing) - Custom pricing adapters
- [Multi-Language Setup](./multi-language-setup) - Language configuration
