[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-filters.svg)](https://npmjs.com/package/@unchainedshop/core-filters)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-filters

Filter and search module for the Unchained Engine. Provides product filtering, faceted search, and filter option management.

## Installation

```bash
npm install @unchainedshop/core-filters
```

## Usage

```typescript
import { configureFiltersModule, FilterType } from '@unchainedshop/core-filters';

const filtersModule = await configureFiltersModule({ db, migrationRepository });

// Create a filter
const filter = await filtersModule.create({
  key: 'color',
  type: FilterType.MULTI_CHOICE,
  options: [],
});

// Add an option
await filtersModule.createFilterOption(filter._id, { value: 'red' });
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureFiltersModule` | Configure and return the filters module |

### Queries

| Method | Description |
|--------|-------------|
| `findFilter` | Find filter by ID or key |
| `findFilters` | Find filters with filtering and pagination |
| `count` | Count filters matching query |
| `filterExists` | Check if filter exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new filter |
| `update` | Update filter data |
| `delete` | Delete a filter, its texts, and cached product IDs |

### Filter Options

| Method | Description |
|--------|-------------|
| `createFilterOption` | Add option to filter |
| `removeFilterOption` | Remove filter option |

### Texts

| Method | Description |
|--------|-------------|
| `texts.findTexts` | Find localized filter texts |
| `texts.updateTexts` | Update filter texts |

### Search services

Product and assortment search are available through `services.filters.searchProducts` and `services.filters.searchAssortments` in [`@unchainedshop/core`](../core/README.md). Use its filter mutation services when changes need to invalidate dependent caches.

### Constants

| Export | Description |
|--------|-------------|
| `FilterType` | Filter types (SWITCH, SINGLE_CHOICE, MULTI_CHOICE, RANGE) |

### Settings

| Export | Description |
|--------|-------------|
| `filtersSettings` | Access filter module settings |

### Types

| Export | Description |
|--------|-------------|
| `Filter` | Filter document type |
| `FilterQuery` | Query parameters type |
| `FiltersModule` | Module interface type |
| `SearchQuery` | Search query type |

## Events

| Event | Description |
|-------|-------------|
| `FILTER_CREATE` | Filter created |
| `FILTER_UPDATE` | Filter updated |
| `FILTER_REMOVE` | Filter deleted |

## License

EUPL-1.2
