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
import '@unchainedshop/plugins/delivery/post.js';
```

## Configuration

Create a delivery provider using this adapter:

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

## Features

- Standard shipping delivery type
- Zero delivery-throughput estimate by default
- Auto-release support
- No external API dependencies

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.post` |
| Type | `SHIPPING` |
| Auto-release | `true` |
| Source | [delivery/post.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/delivery/post.ts) |

## Behavior

### `isActive()`
Always returns `true` - no configuration required.

### `isAutoReleaseAllowed()`
Returns `true` by default, allowing orders to proceed automatically after payment.

### `send()`
Inherits `DeliveryAdapter.send()`, which returns `false`. No shipment is booked and the delivery remains open until it is completed separately or a custom adapter returns a successful result.

### `estimatedDeliveryThroughput()`
Inherits the base implementation and resolves to `0` milliseconds. The Post adapter does not read a delivery-time configuration field; override the method in a custom adapter for a different estimate.

## Extending for Carriers

Start with `DeliveryAdapter` and spread its `actions(config, context)` defaults. A custom `send()` returns `true` for completed delivery, `false` to leave it open, or a worker record for queued work. Persist tracking details separately in the order-delivery context.

The supplied context contains `order`, `orderDelivery`, and `modules`. Load positions with `modules.orders.positions.findOrderPositions({ orderId: order._id })`; order documents do not embed `items`. The delivery address is in `orderDelivery.context.address`, with the order billing address as a fallback.

`estimatedDeliveryThroughput(warehousingTime)` is asynchronous and returns milliseconds. See [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) for the complete contract.

## Delivery Pricing

Combine with delivery pricing adapters:

```typescript
import '@unchainedshop/plugins/pricing/order-delivery.js';
import '@unchainedshop/plugins/pricing/free-delivery.js';
```

Delivery pricing is configured through pricing adapters; the Post adapter itself does not read a price field.

## Related

- [Plugins Overview](./) - All available plugins
- [Stores Delivery](./delivery-stores.md) - Pickup delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Pricing configuration
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
