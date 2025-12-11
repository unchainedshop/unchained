---
sidebar_position: 15
title: Currencies Module
sidebar_label: Currencies
description: Currency configuration and management
---

# Currencies Module

The currencies module manages supported currencies for pricing and transactions.

## Configuration Options

The currencies module has no configuration options.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `CURRENCY_CREATE` | `{ currencyId }` | Emitted when a currency is created |
| `CURRENCY_UPDATE` | `{ currencyId }` | Emitted when a currency is updated |
| `CURRENCY_REMOVE` | `{ currencyId }` | Emitted when a currency is removed |

## More Information

For API usage and detailed documentation, see the [core-currencies package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-currencies).
