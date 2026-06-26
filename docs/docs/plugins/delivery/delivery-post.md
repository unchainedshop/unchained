---
sidebar_position: 2
title: Post Delivery
sidebar_label: Post
description: Standard postal delivery adapter
---

# Post Delivery Adapter

The Post adapter provides standard postal/courier delivery functionality.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/delivery/post';
```

## Configuration

Create a delivery provider using this adapter:

```graphql
mutation CreatePostDelivery {
  createDeliveryProvider(deliveryProvider: {
    type: SHIPPING
    adapterKey: "shop.unchained.delivery.post"
  }) {
    _id
  }
}
```

## Features

- Standard shipping delivery type
- Configurable estimated delivery time
- Auto-release support
- No external API dependencies

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.delivery.post` |
| Type | `SHIPPING` |
| Auto-release | Configurable |
| Source | [delivery/post.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/delivery/post.ts) |

## Behavior

### `isActive()`
Always returns `true` - no configuration required.

### `isAutoReleaseAllowed()`
Returns `true` by default, allowing orders to proceed automatically after payment.

### `send()`
Returns success without external API calls. For production integrations with actual carriers, create a custom adapter.

### `estimatedDeliveryThroughput()`
Returns a default delivery estimate. Override in configuration or extend the adapter for custom calculations.

## Extending for Real Carriers

For production use, register a carrier-specific shipping provider:

```typescript
import { registerShippingDelivery } from '@unchainedshop/core';

registerShippingDelivery({
  adapterId: 'swiss-post',
  estimatedDeliveryThroughput: async (warehousingTime) =>
    warehousingTime + 2 * 24 * 60 * 60 * 1000,
  send: async (configuration, { order }) => {
    await swissPostApi.createShipment({
      recipient: order.delivery.address,
      weight: calculateWeight(order.items),
    });
    return true;
  },
});
```

## Delivery Pricing

Combine with delivery pricing adapters:

```typescript
import '@unchainedshop/plugins/pricing/order-delivery';
import '@unchainedshop/plugins/pricing/free-delivery';
```

Set prices via configuration or custom pricing adapter.

## Related

- [Plugins Overview](./) - All available plugins
- [Stores Delivery](./delivery-stores.md) - Pickup delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Pricing configuration
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
