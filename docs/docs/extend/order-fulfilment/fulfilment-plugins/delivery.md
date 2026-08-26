---
sidebar_position: 2
sidebar_label: Delivery
title: Write a Delivery Provider Plugin
description: Customize delivery
---

# Delivery Provider Plugins

Register custom delivery options by using a delivery factory. There can be multiple delivery adapters; for a given order, only the adapter of the configured delivery provider is invoked.

The factories are:

| Factory | For |
|---|---|
| [`registerShippingDelivery`](../../plugin-factories.md#delivery) | a `SHIPPING` provider |
| [`registerPickUpDelivery`](../../plugin-factories.md#delivery) | a `PICKUP` provider (with `locations`) |
| [`registerDeliveryProvider`](../../plugin-factories.md#delivery) | a generic provider — pick the `type` |

## Example: pickup provider

```typescript
import { registerPickUpDelivery } from '@unchainedshop/core';

registerPickUpDelivery({
  adapterId: 'shop-pickup',
  locations: [
    {
      _id: 'first-location-id',
      name: 'first-location',
      address: { addressLine: 'address-line', postalCode: '1234', countryCode: 'CH', city: 'Zurich' },
      geoPoint: { latitude: 47.3769, longitude: 8.5417 },
    },
  ],
  // Trigger fulfilment; return false to keep the delivery OPEN
  send: async (configuration, context) => {
    await enqueueDeliveryWork({
      type: 'MARK_ORDER_DELIVERED',
      scheduled: new Date(Date.now() + 24 * 60 * 60 * 1000),
      input: { orderDeliveryId: context.orderDelivery?._id },
    });
    return false; // not delivered yet
  },
});
```

## Example: shipping provider

```typescript
import { registerShippingDelivery } from '@unchainedshop/core';

registerShippingDelivery({
  adapterId: 'acme-courier',
  estimatedDeliveryThroughput: async (warehousingThroughputTime) =>
    warehousingThroughputTime + 2 * 24 * 60 * 60 * 1000,
  send: async (configuration, context) => {
    await acme.createShipment(context.order);
    return true; // dispatched
  },
});
```

## Callback reference

| Option | Behavior |
|---|---|
| `send` | any truthy result (`true` or a `Work` item) → delivery status becomes **DELIVERED**; `false` → stays **OPEN** (the order can still progress); throwing → the process is interrupted and the order stays `CONFIRMED` (avoid — see [Fulfilment Process](../index.md)) |
| `active` | enable/disable the adapter (default `true`) |
| `autoReleaseAllowed` | auto-advance status vs require manual delivery confirmation |
| `estimatedDeliveryThroughput` | estimated delivery time in ms |
| `locations` *(pickup)* | available pickup points |

> For full control of every `IDeliveryAdapter` method, build the adapter directly and register it via `pluginRegistry.register()` — see [Plugin System](../../../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Plugin Factories](../../plugin-factories.md#delivery) — the delivery factories
- [Delivery plugins](../../../plugins/delivery/delivery-post) — shipped delivery adapters
