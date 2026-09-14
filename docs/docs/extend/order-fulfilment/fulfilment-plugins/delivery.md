---
sidebar_position: 2
sidebar_label: Delivery
title: Write a Delivery Provider Plugin
description: Customize delivery
---

# Delivery Provider Plugins

A delivery provider selects an adapter through its `adapterKey`. Implement `IDeliveryAdapter` and register it with `DeliveryDirector`, both exported by `@unchainedshop/core`.

## Pickup Adapter

```typescript
import { DeliveryAdapter, DeliveryDirector, type IDeliveryAdapter } from '@unchainedshop/core';
import { DeliveryProviderType, type DeliveryLocation } from '@unchainedshop/core-delivery';

const locations: DeliveryLocation[] = [{
  _id: 'zurich-store',
  name: 'Zurich store',
  address: {
    addressLine: 'Example Street 1',
    postalCode: '8000',
    countryCode: 'CH',
    city: 'Zurich',
  },
  geoPoint: { latitude: 47.3769, longitude: 8.5417 },
}];

const ShopPickup: IDeliveryAdapter = {
  ...DeliveryAdapter,
  key: 'my-shop.delivery.pickup',
  label: 'Pickup at the store',
  version: '1.0.0',
  initialConfiguration: [],

  typeSupported: (type) => type === DeliveryProviderType.PICKUP,

  actions(config, context) {
    return {
      ...DeliveryAdapter.actions(config, context),
      isActive: () => true,
      configurationError: () => null,
      isAutoReleaseAllowed: () => false,
      pickUpLocations: async () => locations,
      pickUpLocationById: async (locationId) =>
        locations.find(({ _id }) => _id === locationId) || null,
      estimatedDeliveryThroughput: async () => 0,
      send: async () => true,
    };
  },
};

DeliveryDirector.registerAdapter(ShopPickup);
```

This adapter requires manual order confirmation before automatic checkout fulfilment. Its `send` action marks delivery complete when invoked; call it when the pickup is ready to be recorded as delivered, or implement your own fulfilment workflow. Import the adapter before startup and select it when creating a pickup provider.

## Actions

| Action | Purpose |
|--------|---------|
| `typeSupported(type)` | Selects supported provider types |
| `configurationError(transactionContext)` | Returns an adapter error or `null` |
| `isActive()` | Indicates whether the provider is usable |
| `isAutoReleaseAllowed()` | Allows checkout to release the order without manual confirmation |
| `estimatedDeliveryThroughput(warehousingThroughputTime)` | Returns estimated delivery time in milliseconds |
| `pickUpLocations()` | Returns pickup locations |
| `pickUpLocationById(locationId)` | Returns one location or `null` |
| `send()` | Performs fulfilment and indicates whether delivery completed |

`send` may return a boolean or a work record. A truthy result marks the delivery as delivered; `false` leaves it open. Throwing propagates an error to the caller; it does not automatically cancel the order.

The second `actions` argument includes the order, delivery record, provider, transaction context, and module APIs when available. There is no third `unchainedAPI` argument.
