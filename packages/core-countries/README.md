[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-countries.svg)](https://npmjs.com/package/@unchainedshop/core-countries)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-countries

Country management module for the Unchained Engine. Manages supported countries with ISO codes, currencies, and activation status.

## Installation

```bash
npm install @unchainedshop/core-countries
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.countries`.

```typescript
const { countries } = platform.unchainedAPI.modules;

const countryId = await countries.create({
  isoCode: 'CH',
  defaultCurrencyCode: 'CHF',
  isActive: true,
});
const country = await countries.findCountry({ countryId });
if (country) {
  const name = countries.name(country, new Intl.Locale('en'));
}
```

`create` returns a country ID. Configure currencies separately before assigning them to countries.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/countries), [public exports](src/countries-index.ts), and [module implementation](src/module/configureCountriesModule.ts) for queries, helpers, and events.

## License

EUPL-1.2
