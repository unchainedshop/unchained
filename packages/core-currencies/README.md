[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-currencies.svg)](https://npmjs.com/package/@unchainedshop/core-currencies)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-currencies

Currency management module for the Unchained Engine. Manages supported currencies with ISO codes and optional blockchain contract addresses.

## Installation

```bash
npm install @unchainedshop/core-currencies
```

## Usage

```typescript
import { configureCurrenciesModule } from '@unchainedshop/core-currencies';

const currenciesModule = await configureCurrenciesModule({ db });

// Create a currency
const currencyId = await currenciesModule.create({
  isoCode: 'CHF',
});

// Find currencies
const currencies = await currenciesModule.findCurrencies({ includeInactive: false });
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureCurrenciesModule` | Configure and return the currencies module |

### Queries

| Method | Description |
|--------|-------------|
| `findCurrency` | Find currency by ID or ISO code |
| `findCurrencies` | Find currencies with filtering, sorting, and pagination |
| `count` | Count currencies matching query |
| `currencyExists` | Check if a currency exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new currency |
| `update` | Update an existing currency |
| `delete` | Soft delete a currency |

### Types

| Export | Description |
|--------|-------------|
| `Currency` | Currency document type |
| `CurrencyQuery` | Query parameters type |
| `CurrenciesModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `CURRENCY_CREATE` | Emitted when a currency is created |
| `CURRENCY_UPDATE` | Emitted when a currency is updated |
| `CURRENCY_REMOVE` | Emitted when a currency is removed |

## License

EUPL-1.2
