---
sidebar_position: 0
title: Plugins
sidebar_label: Overview
description: Available Unchained Engine plugins
---

# Plugins

Unchained Engine uses a plugin architecture to extend functionality. Plugins are organized by category:

## Categories

| Category | Description |
|----------|-------------|
| [Payment](./payment/) | Payment service provider integrations (Stripe, PayPal, etc.) |
| [Delivery](./delivery/) | Shipping and fulfillment methods |
| [Pricing](./pricing/) | Price calculation, taxes, discounts, and rounding |
| [Warehousing](./warehousing/) | Inventory management and stock handling |
| [Filters](./filters/) | Product search and filtering |
| [File Storage](./files/) | File upload backends (GridFS, S3/MinIO) |
| [Workers](./workers/) | Background tasks (email, SMS, webhooks) |
| [Events](./events/) | Event system backends (Node, Redis, EventBridge) |
| [Quotations](./quotations/) | Price quotation and custom offering handling |
| [Enrollments](./enrollments/) | Subscription and recurring order management |

## Quick Setup

For quick setup, use [Plugin Presets](../platform-configuration/plugin-presets.md) which bundle commonly used plugins together.

## Writing Custom Plugins

For creating your own plugins, see the Extending documentation:

- [Custom Payment Plugins](../extend/order-fulfilment/fulfilment-plugins/payment.md)
- [Custom Delivery Plugins](../extend/order-fulfilment/fulfilment-plugins/delivery.md)
- [Custom Warehousing Plugins](../extend/order-fulfilment/fulfilment-plugins/warehousing.md)
- [Custom Filter Plugins](../extend/catalog/filter.md)
- [Custom Pricing Plugins](../extend/pricing/product-pricing.md)
- [Custom Worker Plugins](../extend/worker.md)
- [Custom Quotation Plugins](../extend/quotation.md)
- [Custom Enrollment Plugins](../extend/enrollment.md)
