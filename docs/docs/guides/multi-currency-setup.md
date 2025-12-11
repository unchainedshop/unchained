---
sidebar_position: 7
title: Multi-Currency Setup
sidebar_label: Multi-Currency Setup
description: Configure multiple currencies in Unchained Engine
---

# Multi-Currency Setup

This guide covers configuring multiple currencies and handling currency conversion in Unchained Engine.

## Overview

Unchained Engine supports multiple currencies with automatic conversion:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Product   │────▶│  Pricing System  │────▶│ Converted Price │
│ (Base: CHF) │     │ (Exchange Rates) │     │ (Display: EUR)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

## Configuration

### 1. Set Up Currencies

Create currencies in the system:

```graphql
mutation CreateCurrency {
  createCurrency(currency: {
    isoCode: "EUR"
    contractAddress: null  # For crypto currencies
  }) {
    _id
    isoCode
    isActive
  }
}
```

Or seed currencies at startup:

```typescript
// seed/currencies.ts
export const currencies = [
  { isoCode: 'CHF', isActive: true },
  { isoCode: 'EUR', isActive: true },
  { isoCode: 'USD', isActive: true },
  { isoCode: 'GBP', isActive: true },
  { isoCode: 'ETH', isActive: true, contractAddress: '0x...' }, // Crypto
];

// In your boot script
for (const currency of currencies) {
  await modules.currencies.create(currency);
}
```

### 2. Configure Default Currency

Set the default currency via environment variable:

```bash
# .env
CURRENCY=CHF  # Default currency
```

### 3. Set Country Defaults

Link currencies to countries:

```graphql
mutation UpdateCountry {
  updateCountry(countryId: "CH", country: {
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

## Product Pricing

### Set Base Prices

Products store prices in a base currency:

```graphql
mutation SetProductPrice {
  updateProductCommerce(productId: "product-123", commerce: {
    pricing: [
      {
        currencyCode: "CHF"
        countryCode: "CH"
        amount: 4900  # 49.00 CHF in cents
        isTaxable: true
        isNetPrice: true
      }
    ]
  }) {
    _id
    ... on SimpleProduct {
      simulatedPrice(currencyCode: "CHF") {
        amount
        currencyCode
      }
    }
  }
}
```

### Multi-Currency Prices

You can set different prices per currency:

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

## Exchange Rates

Unchained has a generic currency conversion system that allows you to integrate rate feeds from external sources.

### Product Price Rates API

To insert or update rates programmatically:

```typescript
// Insert/update rates
await modules.products.prices.rates.updateRates(productPriceRates);

// Get a rate for a currency pair
const rate = await modules.products.prices.rates.getRate(
  baseCurrency,    // e.g., 'CHF'
  quoteCurrency,   // e.g., 'EUR'
  referenceDate    // Maximum age of rate
);
```

The `timestamp` field in rate entries determines freshness:
- When set to a UNIX timestamp, only rates within the specified maximum age are returned
- When set to `null`, the rate is always returned regardless of age

The system automatically handles inverse rates - if you have `CHF/EUR`, querying `EUR/CHF` returns the inverse.

### Rate Conversion Plugin

The built-in `shop.unchained.pricing.rate-conversion` plugin consumes these rates. Configure the maximum rate age:

```bash
# Maximum age in seconds (default: 600 = 10 minutes)
CRYPTOPAY_MAX_RATE_AGE=600
```

### Manual Exchange Rates

Set exchange rates manually via the API:

```typescript
// Update exchange rates programmatically
await modules.products.prices.rates.updateRates([
  {
    baseCurrency: 'CHF',
    quoteCurrency: 'EUR',
    rate: 0.92,
    timestamp: Date.now(),
  },
]);
```

### Automatic Exchange Rate Updates

Use a worker to fetch rates periodically:

```typescript
import '@unchainedshop/plugins/worker/external-update-rates';

// Configure the worker
WorkerDirector.configureAutoscheduling({
  type: 'EXTERNAL_UPDATE_RATES',
  input: {
    baseCurrency: 'CHF',
  },
  schedule: '0 0 * * *', // Daily at midnight
});
```

### Custom Exchange Rate Provider

Create a worker to fetch rates from your preferred provider:

```typescript
import { WorkerDirector, type IWorkerAdapter } from '@unchainedshop/core';

const ExchangeRateWorker: IWorkerAdapter = {
  key: 'shop.example.worker.exchange-rates',
  label: 'Custom Exchange Rate Worker',
  version: '1.0.0',
  type: 'UPDATE_EXCHANGE_RATES',
  external: false,
  maxParallelAllocations: 1,

  async doWork(input, unchainedAPI) {
    const { baseCurrency } = input;

    // Fetch rates from your provider (e.g., Open Exchange Rates, Fixer.io)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );
    const data = await response.json();

    // Convert to rate entries with timestamps
    const rates = Object.entries(data.rates).map(([currency, rate]) => ({
      baseCurrency,
      quoteCurrency: currency,
      rate: rate as number,
      timestamp: Date.now(),
    }));

    // Update rates in database
    await unchainedAPI.modules.products.prices.rates.updateRates(rates);

    return { success: true, result: { updated: rates.length } };
  },
};

WorkerDirector.registerAdapter(ExchangeRateWorker);

// Schedule hourly updates
WorkerDirector.configureAutoscheduling({
  type: 'UPDATE_EXCHANGE_RATES',
  input: { baseCurrency: 'CHF' },
  schedule: '0 * * * *',
});
```

## Currency Conversion Pricing Adapter

Create a pricing adapter for automatic conversion:

```typescript
import {
  ProductPricingAdapter,
  ProductPricingDirector,
} from '@unchainedshop/core-pricing';

class CurrencyConversionAdapter extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.currency-conversion';
  static orderIndex = 1; // Run early

  static isActivatedFor({ currencyCode, product }) {
    // Only if product has no price in requested currency
    const hasDirectPrice = product.commerce?.pricing?.some(
      (p) => p.currencyCode === currencyCode
    );
    return !hasDirectPrice;
  }

  async calculate() {
    const { product, currencyCode, modules } = this.context;

    // Get base price
    const basePrice = product.commerce?.pricing?.[0];
    if (!basePrice) return super.calculate();

    // Get exchange rate
    const rate = await modules.currencies.getExchangeRate(
      basePrice.currencyCode,
      currencyCode
    );

    if (rate) {
      this.result.addItem({
        amount: Math.round(basePrice.amount * rate),
        isTaxable: basePrice.isTaxable,
        isNetPrice: basePrice.isNetPrice,
        meta: {
          adapter: this.constructor.key,
          convertedFrom: basePrice.currencyCode,
          rate,
        },
      });
    }

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(CurrencyConversionAdapter);
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
      usdPrice: simulatedPrice(currencyCode: "USD") {
        amount
        currencyCode
      }
    }
  }
}
```

### Cart in User's Currency

```graphql
query CartTotal {
  me {
    cart {
      currency {
        isoCode
      }
      total {
        amount
        currencyCode
      }
      items {
        total {
          amount
          currencyCode
        }
      }
    }
  }
}
```

## Frontend Implementation

### Currency Selector

```tsx
import { useQuery, useMutation } from '@apollo/client';

const CURRENCIES = gql`
  query Currencies {
    currencies(includeInactive: false) {
      _id
      isoCode
    }
  }
`;

function CurrencySelector() {
  const { data } = useQuery(CURRENCIES);
  const [currentCurrency, setCurrentCurrency] = useState('CHF');

  const handleChange = (currency: string) => {
    // Store preference
    localStorage.setItem('currency', currency);

    // Update state
    setCurrentCurrency(currency);

    // Trigger refetch of prices
    apolloClient.resetStore();
  };

  return (
    <select
      value={currentCurrency}
      onChange={(e) => handleChange(e.target.value)}
    >
      {data?.currencies.map((currency) => (
        <option key={currency.isoCode} value={currency.isoCode}>
          {currency.isoCode}
        </option>
      ))}
    </select>
  );
}
```

### Format Currency

```typescript
export function formatPrice(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency,
  });

  // Unchained stores amounts in cents
  return formatter.format(amount / 100);
}

// Currency-specific formatting
const formatters: Record<string, Intl.NumberFormat> = {
  CHF: new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }),
  EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
};

export function formatCurrency(amount: number, currency: string): string {
  const formatter = formatters[currency] || formatters.CHF;
  return formatter.format(amount / 100);
}
```

### Price Component

```tsx
function Price({ amount, currency, className }: {
  amount: number;
  currency: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {formatCurrency(amount, currency)}
    </span>
  );
}

// Usage
<Price amount={product.simulatedPrice.amount} currency="CHF" />
```

## Order Currency Handling

### Set Order Currency

When a cart is created, it uses the user's default currency based on their country:

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
    }
  }
}
```

The cart currency is automatically determined by the user's country and its default currency setting. To change the effective currency for pricing, you would typically update the user's country or configure the order's context.

## Cryptocurrency Support

### Configure Crypto Currency

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
    isActive
  }
}
```

### Crypto Pricing

```typescript
class CryptoPricingAdapter extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.crypto';
  static orderIndex: 2;

  static isActivatedFor({ currencyCode }) {
    return ['ETH', 'BTC', 'USDC'].includes(currencyCode);
  }

  async calculate() {
    const { currencyCode, modules } = this.context;

    // Get crypto exchange rate
    const rate = await fetchCryptoRate(currencyCode);

    // Convert from base currency
    const baseTotal = this.calculation.sum({ category: 'BASE' });

    this.result.addItem({
      amount: convertToCrypto(baseTotal, rate, currencyCode),
      isTaxable: false,
      isNetPrice: true,
      meta: { cryptoRate: rate },
    });

    return super.calculate();
  }
}
```

## Best Practices

### 1. Store Amounts in Smallest Unit

Always use the smallest unit (cents, wei, etc.):

```typescript
// Good
const price = 4999; // 49.99 CHF

// Bad
const price = 49.99; // Floating point issues
```

### 2. Handle Rounding

Be consistent with rounding:

```typescript
// Round to nearest cent
const converted = Math.round(basePrice * exchangeRate);
```

### 3. Cache Exchange Rates

Don't fetch rates on every request:

```typescript
// Cache rates for 1 hour
const rateCache = new Map<string, { rate: number; expires: number }>();

async function getExchangeRate(from: string, to: string): Promise<number> {
  const key = `${from}-${to}`;
  const cached = rateCache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.rate;
  }

  const rate = await fetchRate(from, to);
  rateCache.set(key, { rate, expires: Date.now() + 3600000 });

  return rate;
}
```

### 4. Show Original and Converted Prices

For transparency, show both prices:

```tsx
function ProductPrice({ product, displayCurrency }) {
  const basePrice = product.commerce?.pricing?.[0];
  const displayPrice = product.simulatedPrice;

  return (
    <div>
      <span className="main-price">
        {formatCurrency(displayPrice.amount, displayCurrency)}
      </span>
      {basePrice.currencyCode !== displayCurrency && (
        <span className="original-price">
          (≈ {formatCurrency(basePrice.amount, basePrice.currencyCode)})
        </span>
      )}
    </div>
  );
}
```

## Related

- [Currencies Module](../platform-configuration/modules/currencies) - Currency configuration
- [Pricing System](../concepts/pricing-system) - Pricing architecture
- [Multi-Language Setup](./multi-language-setup) - Language configuration
