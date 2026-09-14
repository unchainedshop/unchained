[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-filters.svg)](https://npmjs.com/package/@unchainedshop/core-filters)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-filters

Filter and search module for the Unchained Engine. Provides product filtering, faceted search, and filter option management.

## Installation

```bash
npm install @unchainedshop/core-filters
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.filters`.

```typescript
const { filters } = platform.unchainedAPI.modules;
const availableFilters = await filters.findFilters({});
```

Filter adapters determine product membership and search behavior. Configure cache callbacks through `options.filters` at platform startup; custom cache implementations must replace complete generations and prevent older rebuilds from overwriting newer data.

See the [search and filtering guide](https://docs.unchained.shop/guides/search-and-filtering), [cache contract](https://docs.unchained.shop/platform-configuration/modules/filters), [public exports](src/filters-index.ts), and [module implementation](src/module/configureFiltersModule.ts).

## License

EUPL-1.2
