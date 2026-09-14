---
sidebar_position: 3
title: Stores Delivery
sidebar_label: Stores
description: Store pickup delivery adapter
---

# Stores Delivery Adapter

The Stores adapter provides pickup location functionality for in-store or warehouse pickup.

## Installation

```typescript
import '@unchainedshop/plugins/delivery/stores.js';
```

## Configuration

Create a delivery provider with pickup locations:

```graphql
mutation CreateStoresDelivery {
  createDeliveryProvider(deliveryProvider: {
    type: PICKUP
    adapterKey: "shop.unchained.stores"
  }) {
    _id
  }
}
```

Configure the stores after creation via the Admin UI or update the provider's configuration with a JSON array of stores.

## Features

- Store/warehouse pickup support
- Multiple pickup location management
- JSON-based store configuration
- No external API dependencies

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.stores` |
| Type | `PICKUP` |
| Auto-release | `false` |
| Source | [delivery/stores.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/delivery/stores.ts) |

## Configuration Options

### `stores`

Set the configuration entry `stores` to a JSON-encoded array of pickup locations. Store addresses and coordinates must use the nested `address` and `geoPoint` shapes:

```json
[
  {
    "_id": "store-1",
    "name": "Main Store",
    "address": {
      "addressLine": "123 Main Street",
      "city": "Zurich",
      "postalCode": "8001",
      "countryCode": "CH"
    },
    "geoPoint": {
      "latitude": 47.3769,
      "longitude": 8.5417
    }
  }
]
```

## Behavior

### `isActive()`
Returns `true` even when no stores are configured. Set a valid `stores` array before offering pickup locations.

### `isAutoReleaseAllowed()`
Returns `false`, requiring manual order confirmation. The inherited `send()` also returns `false`, so confirming the order does not mark the pickup as delivered.

### `pickUpLocations()`
Returns all configured store locations.

### `pickUpLocationById(id)`
Returns a specific store location by ID.

## Usage in Checkout

```graphql
query GetPickupLocations($providerId: ID!) {
  deliveryProvider(deliveryProviderId: $providerId) {
    ... on DeliveryProviderPickUp {
      simulatedPrice {
        amount
        currencyCode
      }
      pickUpLocations {
        _id
        name
        address {
          addressLine
          city
        }
        geoPoint {
          latitude
          longitude
        }
      }
    }
  }
}
```

Select pickup location for order:

```graphql
mutation SetPickupLocation($deliveryProviderId: ID!, $locationId: ID!) {
  updateCartDeliveryPickUp(
    deliveryProviderId: $deliveryProviderId
    orderPickUpLocationId: $locationId
  ) {
    _id
    delivery {
      ... on OrderDeliveryPickUp {
        activePickUpLocation {
          _id
          name
        }
      }
    }
  }
}
```

## Dynamic Locations

For locations managed by another service, use your own lookup function. There is no `findWarehouses` or `findWarehouse` method on the warehousing module.

```typescript
import { DeliveryAdapter, DeliveryDirector, type IDeliveryAdapter } from '@unchainedshop/core';
import { DeliveryProviderType, type DeliveryLocation } from '@unchainedshop/core-delivery';

function registerDynamicStores(loadStores: () => Promise<DeliveryLocation[]>) {
  const adapter: IDeliveryAdapter = {
    ...DeliveryAdapter,
    key: 'my-shop.dynamic-stores',
    label: 'Dynamic Store Locations',
    version: '1.0.0',
    typeSupported: (type) => type === DeliveryProviderType.PICKUP,
    actions(config, context) {
      return {
        ...DeliveryAdapter.actions(config, context),
        configurationError: () => null,
        isActive: () => true,
        isAutoReleaseAllowed: () => false,
        pickUpLocations: loadStores,
        pickUpLocationById: async (id) => (await loadStores()).find((store) => store._id === id) || null,
      };
    },
  };
  DeliveryDirector.registerAdapter(adapter);
}
```

Call `registerDynamicStores` with your application's lookup function. `pickUpLocations()` has no search-parameter argument; implement nearest-store sorting in your storefront or in a custom service with its own inputs.

## Related

- [Plugins Overview](./) - All available plugins
- [Post Delivery](./delivery-post.md) - Shipping delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Pricing configuration
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
