[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-delivery.svg)](https://npmjs.com/package/@unchainedshop/core-delivery)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-delivery

Delivery provider module for the Unchained Engine. Manages delivery providers, shipping methods, and delivery processing.

## Installation

```bash
npm install @unchainedshop/core-delivery
```

## Usage

```typescript
import { configureDeliveryModule, DeliveryProviderType } from '@unchainedshop/core-delivery';

const deliveryModule = await configureDeliveryModule({ db, migrationRepository });

// Create a delivery provider
const provider = await deliveryModule.create({
  type: DeliveryProviderType.SHIPPING,
  configuration: [],
  adapterKey: 'shop.unchained.post',
});

// Find configured providers
const providers = await deliveryModule.findProviders({});
```

Context-dependent provider selection is available through `services.orders.supportedDeliveryProviders` in [`@unchainedshop/core`](../core/README.md).

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureDeliveryModule` | Configure and return the delivery module |

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
| `create` | Create a new delivery provider |
| `update` | Update provider configuration |
| `delete` | Soft delete a provider |

### Constants

| Export | Description |
|--------|-------------|
| `DeliveryProviderType` | Provider types (SHIPPING, PICKUP) |

### Settings

| Export | Description |
|--------|-------------|
| `deliverySettings` | Access delivery module settings |

### Types

| Export | Description |
|--------|-------------|
| `DeliveryProvider` | Provider document type |
| `DeliveryModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `DELIVERY_PROVIDER_CREATE` | Provider created |
| `DELIVERY_PROVIDER_UPDATE` | Provider updated |
| `DELIVERY_PROVIDER_REMOVE` | Provider deleted |

## License

EUPL-1.2
