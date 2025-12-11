---
sidebar_position: 8
title: Warehousing Module
sidebar_label: Warehousing
description: Inventory and stock management
---

# Warehousing Module

The warehousing module manages inventory, stock levels, and tokenized product handling.

## Configuration Options

The warehousing module has no configuration options.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `WAREHOUSING_PROVIDER_CREATE` | `{ warehousingProvider }` | Emitted when a warehousing provider is created |
| `WAREHOUSING_PROVIDER_UPDATE` | `{ warehousingProvider }` | Emitted when a warehousing provider is updated |
| `WAREHOUSING_PROVIDER_REMOVE` | `{ warehousingProvider }` | Emitted when a warehousing provider is removed |

## More Information

For API usage and detailed documentation, see the [core-warehousing package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-warehousing).
