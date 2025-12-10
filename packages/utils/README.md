[![npm version](https://img.shields.io/npm/v/@unchainedshop/utils.svg)](https://npmjs.com/package/@unchainedshop/utils)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/utils

Common utility functions and base classes for the Unchained Engine.

## Installation

```bash
npm install @unchainedshop/utils
```

## Usage

```typescript
import { slugify, generateRandomHash, resolveBestSupported } from '@unchainedshop/utils';

// Generate URL-safe slugs
const slug = slugify('Hello World!'); // 'hello-world'

// Generate random hashes
const hash = generateRandomHash();

// Resolve best supported locale
const locale = resolveBestSupported('en-US,de-CH', 'CH', {
  countries: [{ isoCode: 'CH' }],
  languages: [{ isoCode: 'de' }, { isoCode: 'en' }],
});
```

## API Overview

### String Utilities

| Export | Description |
|--------|-------------|
| `slugify` | Convert string to URL-safe slug |
| `findUnusedSlug` | Find an unused slug by appending numbers |
| `generateRandomHash` | Generate a random hash string |
| `sha256` | Compute SHA-256 hash of a string |
| `sha1` | Compute SHA-1 hash of a string |

### Locale Helpers

| Export | Description |
|--------|-------------|
| `systemLocale` | Default system locale from environment |
| `resolveBestSupported` | Resolve best supported locale from Accept-Language |
| `resolveBestCurrency` | Resolve best currency from available options |
| `determineFallbackLocale` | Determine fallback locale from countries/languages |

### Calculation Utilities

Available under the `calculation` namespace:

| Export | Description |
|--------|-------------|
| `roundToNext` | Round value up to next precision step |
| `calculateAmountToSplit` | Calculate amount to split based on rate/fixed |
| `applyRate` | Apply rate or fixed amount to a value |
| `getTaxAmount` | Calculate tax amount from total and rate |
| `resolveAmountAndTax` | Resolve share amount and tax from ratio |
| `applyDiscountToMultipleShares` | Apply discount across multiple shares |

### Object Utilities

| Export | Description |
|--------|-------------|
| `objectInvert` | Invert object keys and values |
| `buildObfuscatedFieldsFilter` | Build filter for obfuscating sensitive fields |

### Director/Adapter Base Classes

| Export | Description |
|--------|-------------|
| `BaseAdapter` | Base class for all adapters with logging support |
| `BaseDirector` | Factory for creating adapter directors |
| `IBaseAdapter` | Interface for adapter implementations |
| `IBaseDirector` | Interface for director implementations |

### Swiss-specific Helpers

Available under the `ch` namespace:

| Export | Description |
|--------|-------------|
| `addressToString` | Format Swiss address as string |
| `priceToString` | Format price for Swiss locale |

### Types

| Export | Description |
|--------|-------------|
| `SortDirection` | Enum-like object for ASC/DESC sorting |
| `SortOption` | Interface for sort options |
| `Price` | Interface for price with amount and currency |
| `PricingCalculation` | Interface for pricing calculations |
| `DateFilterInput` | Interface for date range filtering |
| `Tree<T>` | Type for tree data structures |
| `NodeOrTree<T>` | Type for tree nodes |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UNCHAINED_LANG` | `de` | Default language code |
| `UNCHAINED_COUNTRY` | `CH` | Default country code |
| `UNCHAINED_CURRENCY` | `CHF` | Default currency code |

## License

EUPL-1.2
