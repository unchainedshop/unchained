---
sidebar_position: 7
title: Multi-Currency Setup
sidebar_label: Multi-Currency Setup
description: Configure multiple currencies in Unchained Engine
---

# Multi-Currency Setup

This guide covers configuring multiple currencies and handling currency conversion in Unchained Engine.

## Overview

Unchained Engine supports explicit prices in multiple currencies and conversion through the rate-conversion pricing plugin:

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
    contractAddress: null  # For token currencies
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
UNCHAINED_CURRENCY=CHF  # Fallback currency used during currency resolution
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

Store rates with a validity window. The numeric rate converts major units; the rate lookup accounts for currency decimals when producing a minor-unit conversion factor.

```typescript
await modules.products.prices.rates.updateRates([
  {
    baseCurrency: 'CHF',
    quoteCurrency: 'EUR',
    rate: 0.92, // Illustrative fixture rate
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  },
]);

const baseCurrency = await modules.currencies.findCurrency({ isoCode: 'CHF' });
const quoteCurrency = await modules.currencies.findCurrency({ isoCode: 'EUR' });
if (!baseCurrency || !quoteCurrency) throw new Error('Configure both currencies first');
const rateData = await modules.products.prices.rates.getRate(
  baseCurrency,
  quoteCurrency,
  new Date(),
);
// rateData is { rate, expiresAt } or null.
```

`getRate()` takes currency objects and a reference date. It selects the newest rate whose `timestamp` is on or before that date and whose `expiresAt` is on or after it. Missing or expired validity windows do not match. Inverse pairs are supported automatically.

### Rate Conversion Plugin

```typescript
import '@unchainedshop/plugins/pricing/product-catalog-price.js';
import '@unchainedshop/plugins/pricing/product-price-rateconversion.js';
```

The catalog adapter runs first. The rate-conversion adapter (`shop.unchained.pricing.rate-conversion`, order index 10) runs when no earlier adapter has produced a price. It finds a source price for the requested country and quantity, requires both currencies to be active, and uses `modules.products.prices.rates.getRate()` to convert it. It preserves tax flags and multiplies the converted unit price by quantity.

A direct price in another country does not bypass country selection: configure the relevant country prices as well as currencies. The conversion adapter uses the stored rate validity window; it does not read `CRYPTOPAY_MAX_RATE_AGE`.

### Automatic Exchange Rate Updates

The built-in Coinbase worker fetches configured currencies and registers a schedule that runs every minute:

```typescript
import '@unchainedshop/plugins/worker/update-coinbase-rates.js';
```

It chooses its base currency with the configured currency fallback, stores `Date` timestamps, and gives rates a five-minute validity window. It does not read a `baseCurrency` input. Keep the normal worker queue enabled so scheduled tasks execute.

For another provider, implement a [worker adapter](../extend/worker.md) that calls `modules.products.prices.rates.updateRates()` with the same rate structure. Pass parsed schedules from `schedule.parse.cron(...)` to `WorkerDirector.configureAutoscheduling()` rather than a cron string.

## Currency Conversion Pricing Adapter

The built-in conversion adapter already handles source-price selection, active currencies, decimals, validity windows, and quantity. To customize it, compose `ProductPricingAdapter` from `@unchainedshop/core` using the current [pricing adapter pattern](../concepts/director-adapter-pattern.md#pricing-directors). Read prior rows from `params.calculationSheet`, add converted rows with `baseActions.resultSheet().addItem(...)`, and return `baseActions.calculate()`.

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
// This helper is for currencies with two decimal places.
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

// This example handles CHF, EUR, and USD, all with two decimal places.
export function formatCurrency(amount: number, currency: string): string {
  const formatter = formatters[currency] || new Intl.NumberFormat('en', { style: 'currency', currency });
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

The initial cart currency is resolved from its country and configured currencies. Existing orders store `currencyCode`; changing a storefront display preference does not automatically change the cart currency. Use the cart APIs and configured checkout flow to update the order, and read its returned currency before displaying totals.

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

The same rate-conversion adapter can convert between configured fiat and cryptocurrency entries. Configure each currency's `decimals`, provide rates with validity windows, and enable the applicable payment adapter. `getRate()` normalizes the conversion factor for source and target decimals; applying an additional decimal multiplier would double-convert the amount.

## Best Practices

### 1. Store Amounts in Smallest Unit

Use integer amounts in the engine’s currency representation. Fiat currencies typically use cents. Product rate normalization defaults to two decimals when unspecified and caps cryptocurrency precision at nine decimals, even when the blockchain uses more (for example ETH at 18). Convert to blockchain base units at the payment boundary:

```typescript
// Good
const price = 4999; // 49.99 CHF (2 decimals)

// Bad
const price = 49.99; // Floating point issues
```

### 2. Handle Rounding

Be consistent with rounding:

```typescript
// Round to nearest cent
const converted = Math.round(basePrice * exchangeRate);
```

### 3. Respect Rate Expiry

The rate store is already shared through MongoDB. If a custom integration adds an in-memory cache, expire each entry no later than the rate's `expiresAt` value, and refresh it when the underlying rates change. A fixed one-hour cache can keep serving a rate that has already expired.

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
