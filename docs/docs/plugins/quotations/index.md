---
sidebar_position: 8
title: Quotation Plugins
sidebar_label: Quotations
description: Quotation/offering plugins for Unchained Engine
---

# Quotation Plugins

Quotation plugins handle the creation and management of price quotations and custom offerings for products.

| Adapter Key | Description | Preset |
|-------------|-------------|--------|
| [`shop.unchained.quotations.manual`](./quotation-manual.md) | Manual quotation handling with 1-hour expiry | `base` |

## How Quotations Work

1. Customer requests a quotation for a product
2. The quotation adapter processes the request
3. A quote is generated with an expiration time
4. The customer can accept or reject the quote
5. Accepted quotes can be used to create orders

## Creating Custom Quotation Plugins

See [Custom Quotation Plugins](../../extend/quotation.md) for creating your own quotation adapters.
