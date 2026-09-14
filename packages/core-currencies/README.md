[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-currencies.svg)](https://npmjs.com/package/@unchainedshop/core-currencies)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-currencies

Currency management module for the Unchained Engine. Manages supported currencies with ISO codes and optional blockchain contract addresses.

## Installation

```bash
npm install @unchainedshop/core-currencies
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.currencies`.

```typescript
const { currencies } = platform.unchainedAPI.modules;

const currencyId = await currencies.create({ isoCode: 'CHF', isActive: true });
const currency = await currencies.findCurrency({ currencyId });
const activeCurrencies = await currencies.findCurrencies({ includeInactive: false });
```

`create` returns a currency ID. Monetary amounts use integer minor units; use the currency's decimal precision when converting amounts for display.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/currencies), [public exports](src/currencies-index.ts), and [module implementation](src/module/configureCurrenciesModule.ts) for the API and events.

## License

EUPL-1.2
