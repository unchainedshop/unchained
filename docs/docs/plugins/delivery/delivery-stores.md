---
sidebar_position: 3
title: Stores Delivery
sidebar_label: Stores
description: Store pickup delivery adapter
---

# Stores Delivery Adapter

Pickup delivery from a static list of stores configured on the provider. No external API dependencies.

:::info Included in All Preset
Registered automatically by `registerAllPlugins()`.
:::

If you use the `base` preset or register plugins individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { PickMupPlugin } from '@unchainedshop/plugins/delivery/stores';

pluginRegistry.register(PickMupPlugin);
```

## Setup

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

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.stores` |
| Type | `PICKUP` |
| Auto-release | `false` (pickup orders require manual confirmation) |
| Source | [delivery/stores](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/delivery/stores) |

## Configuration Options

Set a `stores` configuration key on the provider (Admin UI or `updateDeliveryProvider`) containing a JSON array of locations. Each location should match the `DeliveryLocation` shape:

```json
[
  {
    "_id": "store-1",
    "name": "Main Store",
    "address": {
      "addressLine": "Bahnhofstrasse 1",
      "postalCode": "8001",
      "city": "Zurich",
      "countryCode": "CH"
    },
    "geoPoint": { "latitude": 47.3769, "longitude": 8.5417 }
  }
]
```

`pickUpLocations()` returns the parsed array; `pickUpLocationById(id)` matches on `_id`.

## Usage in Checkout

```graphql
query GetPickupLocations($providerId: ID!) {
  deliveryProvider(deliveryProviderId: $providerId) {
    ... on DeliveryProviderPickUp {
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

Select a pickup location for the cart:

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

## Dynamic Store Locations

For stores managed in a database or external system, register a pickup adapter with a `locations` callback via the `registerPickUpDelivery` factory:

```typescript
import { registerPickUpDelivery } from '@unchainedshop/core';

registerPickUpDelivery({
  adapterId: 'dynamic-stores',
  autoReleaseAllowed: false,
  locations: async () => {
    const stores = await storeRepository.findActive();
    return stores.map((store) => ({
      _id: store._id,
      name: store.name,
      address: store.address,
      geoPoint: store.geoPoint,
    }));
  },
  send: async (configuration, { order }) => {
    await notifyStore(order);
    return false;
  },
});
```

## Related

- [Post Delivery](./delivery-post.md) - Shipping delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Pricing configuration
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
