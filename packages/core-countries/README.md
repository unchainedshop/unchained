[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-countries.svg)](https://npmjs.com/package/@unchainedshop/core-countries)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-countries

Country management module for the Unchained Engine. Manages supported countries with ISO codes, currencies, and activation status.

## Installation

```bash
npm install @unchainedshop/core-countries
```

## Usage

```typescript
import { configureCountriesModule } from '@unchainedshop/core-countries';

const countriesModule = await configureCountriesModule({ db });

// Create a country
const countryId = await countriesModule.create({
  isoCode: 'CH',
  defaultCurrencyCode: 'CHF',
});

// Find countries
const countries = await countriesModule.findCountries({ includeInactive: false });

// Get localized country name
const name = countriesModule.name(country, new Intl.Locale('en'));
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureCountriesModule` | Configure and return the countries module |

### Queries

| Method | Description |
|--------|-------------|
| `findCountry` | Find country by ID or ISO code |
| `findCountries` | Find countries with filtering, sorting, and pagination |
| `count` | Count countries matching query |
| `countryExists` | Check if a country exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new country |
| `update` | Update an existing country |
| `delete` | Soft delete a country |

### Helper Methods

| Method | Description |
|--------|-------------|
| `name` | Get localized country name using Intl.DisplayNames |
| `flagEmoji` | Get flag emoji for a country |
| `isBase` | Check if country is the base/system country |

### Types

| Export | Description |
|--------|-------------|
| `Country` | Country document type |
| `CountryQuery` | Query parameters type |
| `CountriesModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `COUNTRY_CREATE` | Emitted when a country is created |
| `COUNTRY_UPDATE` | Emitted when a country is updated |
| `COUNTRY_REMOVE` | Emitted when a country is removed |

## License

EUPL-1.2
