---
sidebar_position: 0
title: Delivery Plugins
sidebar_label: Delivery
description: Delivery provider plugins for Unchained Engine
---

# Delivery Plugins

Delivery plugins handle shipping and fulfillment methods.

| Adapter Key | Description | Use Case | Tracking |
|-------------|-------------|----------|----------|
| [`shop.unchained.post`](./delivery-post.md) | Generic postal delivery | Physical goods shipped via postal service | Manual |
| [`shop.unchained.delivery.send-message`](./delivery-send-message.md) | Message-based delivery (digital) | Digital goods, license keys, download links | Automatic |
| [`shop.unchained.stores`](./delivery-stores.md) | In-store pickup | Click-and-collect, local pickup | Manual |

## Creating Custom Delivery Plugins

See [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) for creating your own delivery adapters.
