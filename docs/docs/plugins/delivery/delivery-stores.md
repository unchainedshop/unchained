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
import '@unchainedshop/plugins/delivery/stores';
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

JSON array of pickup locations. Each location should have:

```json
[
  {
    "_id": "store-1",
    "name": "Main Store",
    "address": "123 Main Street, Zurich",
    "city": "Zurich",
    "postalCode": "8001",
    "countryCode": "CH",
    "coordinates": {
      "lat": 47.3769,
      "lng": 8.5417
    },
    "openingHours": "Mon-Fri 9-18, Sat 9-16"
  },
  {
    "_id": "store-2",
    "name": "Airport Shop",
    "address": "Zurich Airport, Terminal 2"
  }
]
```

## Behavior

### `isActive()`
Always returns `true` - no configuration required.

### `isAutoReleaseAllowed()`
Returns `false` - pickup orders require manual confirmation.

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

## Extending for Dynamic Stores

For stores managed in a database or external system:

```typescript
import { DeliveryDirector, type IDeliveryAdapter } from '@unchainedshop/core';

const DynamicStoresAdapter: IDeliveryAdapter = {
  key: 'my-shop.dynamic-stores',
  label: 'Dynamic Store Locations',
  version: '1.0.0',

  typeSupported: (type) => type === 'PICKUP',

  actions(config, context) {
    const { modules } = context;

    return {
      configurationError() { return null; },
      isActive() { return true; },
      isAutoReleaseAllowed() { return false; },

      async pickUpLocations() {
        // Fetch from database or external API
        const stores = await modules.warehousing.findWarehouses({
          type: 'STORE',
          isActive: true,
        });

        return stores.map(store => ({
          _id: store._id,
          name: store.name,
          address: store.address,
          geoPoint: store.coordinates ? {
            latitude: store.coordinates.lat,
            longitude: store.coordinates.lng,
          } : null,
        }));
      },

      async pickUpLocationById(locationId) {
        const store = await modules.warehousing.findWarehouse({ _id: locationId });
        if (!store) return null;

        return {
          _id: store._id,
          name: store.name,
          address: store.address,
        };
      },

      async send() {
        // Notify store about pickup order
        const { order } = context;
        await notifyStore(order);
        return { status: 'READY_FOR_PICKUP' };
      },

      estimatedDeliveryThroughput(warehousingTime) {
        // Pickup ready same day
        return warehousingTime;
      },
    };
  },
};

DeliveryDirector.registerAdapter(DynamicStoresAdapter);
```

## Store Locator Integration

Combine with geolocation for nearest store finder:

```typescript
async pickUpLocations(searchParams) {
  const stores = await getAllStores();

  if (searchParams?.coordinates) {
    // Sort by distance
    return stores
      .map(store => ({
        ...store,
        distance: calculateDistance(
          searchParams.coordinates,
          store.coordinates
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  return stores;
}
```

## Related

- [Plugins Overview](./) - All available plugins
- [Post Delivery](./delivery-post.md) - Shipping delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Pricing configuration
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
