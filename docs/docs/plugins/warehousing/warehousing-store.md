---
sidebar_position: 2
title: Store Warehousing
sidebar_label: Store
description: Physical inventory management adapter
---

# Store Warehousing Adapter

Basic physical warehousing that always reports stock as available. Use it when inventory is managed outside the system, for drop-shipping, or during development.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` and `registerAllPlugins()`.
:::

If you register plugins individually instead of using a preset:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { StorePlugin } from '@unchainedshop/plugins/warehousing/store';

pluginRegistry.register(StorePlugin);
```

## Setup

```graphql
mutation CreateStoreWarehousing {
  createWarehousingProvider(warehousingProvider: {
    type: PHYSICAL
    adapterKey: "shop.unchained.warehousing.store"
  }) {
    _id
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.warehousing.store` |
| Type | `PHYSICAL` |
| Order Index | `0` |
| Source | [warehousing/store](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/warehousing/store) |

## Configuration Options

| Key | Description | Default |
|-----|-------------|---------|
| `name` | Store/warehouse name | `"Flagship Store"` |

## Behavior

- `isActive()` returns `true`
- `stock()` returns `99999` (effectively unlimited)
- `productionTime()` returns `0`
- `commissioningTime()` returns `0`

## Real Inventory

For production inventory tracking, register a custom adapter with the `registerPhysicalWarehousing` factory. `stock`, `productionTime`, and `commissioningTime` accept either a constant or a callback:

```typescript
import { registerPhysicalWarehousing } from '@unchainedshop/core';

registerPhysicalWarehousing({
  adapterId: 'real-store',
  stock: async (referenceDate, configuration, { product }) => {
    const sku = product?.warehousing?.sku;
    if (!sku) return 0;
    const inventory = await inventoryDb.findOne({ sku });
    return inventory?.quantity || 0;
  },
  commissioningTime: 4 * 60 * 60 * 1000,
});
```

## Query Stock Status

```graphql
query ProductAvailability($productId: ID!) {
  product(productId: $productId) {
    ... on SimpleProduct {
      simulatedStocks {
        warehousingProvider {
          _id
          interface { label }
        }
        quantity
      }
    }
  }
}
```

## Related

- [ETH Minter](./warehousing-eth-minter.md) - Virtual/NFT inventory
- [Custom Warehousing Plugins](../../extend/order-fulfilment/fulfilment-plugins/warehousing.md) - Write your own
