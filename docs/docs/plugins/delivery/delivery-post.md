---
sidebar_position: 2
title: Post Delivery
sidebar_label: Post
description: Standard postal delivery adapter
---

# Post Delivery Adapter

Manual shipping delivery without external carrier integration. Use it for physical goods where shipping is handled outside the system.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` and `registerAllPlugins()`.
:::

If you register plugins individually instead of using a preset:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { PostPlugin } from '@unchainedshop/plugins/delivery/post';

pluginRegistry.register(PostPlugin);
```

## Setup

```graphql
mutation CreatePostDelivery {
  createDeliveryProvider(deliveryProvider: {
    type: SHIPPING
    adapterKey: "shop.unchained.post"
  }) {
    _id
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.post` |
| Type | `SHIPPING` |
| Source | [delivery/post](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/delivery/post) |

## Behavior

- `isActive()` returns `true` and `configurationError()` returns `null` — no configuration required.
- All other actions use the `DeliveryAdapter` defaults: `isAutoReleaseAllowed()` returns `true` (delivery is released automatically after order confirmation), `send()` returns `false` (the delivery status stays unchanged — mark deliveries as delivered manually), and `estimatedDeliveryThroughput()` returns `0`.

## Extending for Real Carriers

For carrier integrations, register a custom shipping adapter with the `registerShippingDelivery` factory:

```typescript
import { registerShippingDelivery } from '@unchainedshop/core';

registerShippingDelivery({
  adapterId: 'swiss-post',
  estimatedDeliveryThroughput: async (warehousingTime) =>
    warehousingTime + 2 * 24 * 60 * 60 * 1000,
  send: async (configuration, { order, orderDelivery }) => {
    await swissPostApi.createShipment({
      recipient: orderDelivery.context?.address || order.billingAddress,
    });
    return true; // marks the delivery as DELIVERED
  },
});
```

## Related

- [Stores Delivery](./delivery-stores.md) - Pickup delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Pricing configuration
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
