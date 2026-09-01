---
sidebar_position: 0
title: Delivery Plugins
sidebar_label: Delivery
description: Delivery provider plugins for Unchained Engine
---

# Delivery Plugins

Delivery plugins handle shipping and fulfillment methods.

| Adapter Key | Description | Preset |
|-------------|-------------|--------|
| [`shop.unchained.post`](./delivery-post.md) | Manual shipping delivery | `base` |
| [`shop.unchained.delivery.send-message`](./delivery-send-message.md) | Forwards order details via the messaging system | `all` |
| [`shop.unchained.stores`](./delivery-stores.md) | In-store pickup from pre-configured locations | `all` |

## Creating Custom Delivery Plugins

See [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) for creating your own delivery adapters.
