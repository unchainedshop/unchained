[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-warehousing.svg)](https://npmjs.com/package/@unchainedshop/core-warehousing)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-warehousing

Warehousing provider module for the Unchained Engine. Manages inventory, stock levels, and tokenized product surrogates.

## Installation

```bash
npm install @unchainedshop/core-warehousing
```

## Usage

```typescript
import { configureWarehousingModule, WarehousingProviderType } from '@unchainedshop/core-warehousing';

const warehousingModule = await configureWarehousingModule({ db, migrationRepository });

// Create a warehousing provider
const provider = await warehousingModule.create({
  type: WarehousingProviderType.PHYSICAL,
  configuration: [],
  adapterKey: 'shop.unchained.warehousing.store',
});

// Find providers
const providers = await warehousingModule.findProviders({});
```

Context-dependent provider selection is available through `services.orders.supportedWarehousingProviders` in [`@unchainedshop/core`](../core/README.md).

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureWarehousingModule` | Configure and return the warehousing module |

### Queries

| Method | Description |
|--------|-------------|
| `findProvider` | Find provider by ID |
| `findProviders` | Find providers with filtering |
| `count` | Count providers |
| `providerExists` | Check if provider exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new warehousing provider |
| `update` | Update provider configuration |
| `delete` | Soft delete a provider |

### Token Surrogates

For tokenized products (NFTs):

| Method | Description |
|--------|-------------|
| `findToken` | Find a token surrogate by ID |
| `findTokens` | Find token surrogates with a selector |
| `createTokens` | Insert token surrogates |
| `updateTokenOwnership` | Update token ownership |
| `invalidateToken` | Invalidate a token surrogate |

### Constants

| Export | Description |
|--------|-------------|
| `WarehousingProviderType` | Provider types (PHYSICAL, VIRTUAL) |

### Types

| Export | Description |
|--------|-------------|
| `WarehousingProvider` | Provider document type |
| `TokenSurrogate` | Token surrogate document type |
| `WarehousingModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `WAREHOUSING_PROVIDER_CREATE` | Provider created |
| `WAREHOUSING_PROVIDER_UPDATE` | Provider updated |
| `WAREHOUSING_PROVIDER_REMOVE` | Provider deleted |

## License

EUPL-1.2
