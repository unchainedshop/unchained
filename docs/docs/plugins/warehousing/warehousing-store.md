---
sidebar_position: 2
title: Store Warehousing
sidebar_label: Store
description: Physical inventory management adapter
---

# Store Warehousing Adapter

The Store adapter provides basic physical inventory management for simple use cases.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/warehousing/store';
```

## Configuration

Create a warehousing provider:

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

Configure the `name` via the Admin UI after creation.

## Features

- Physical inventory management
- Unlimited stock (returns 99999)
- Zero production/commissioning time
- Simple drop-in for development

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.warehousing.store` |
| Type | `PHYSICAL` |
| Order Index | `0` |
| Default Stock | `99999` |
| Source | [warehousing/store.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/warehousing/store.ts) |

## Configuration Options

| Key | Description | Default |
|-----|-------------|---------|
| `name` | Store/warehouse name | `"Flagship Store"` |

## Behavior

### `isActive()`
Always returns `true`.

### `stock()`
Returns `99999` - effectively unlimited stock.

### `productionTime()`
Returns `0` - no production delay.

### `commissioningTime()`
Returns `0` - no preparation delay.

## Use Cases

### Development & Testing

Use the Store adapter during development when you don't need real inventory tracking:

```typescript
import '@unchainedshop/plugins/warehousing/store';
```

### Simple Stores

For small shops where inventory is managed manually outside the system.

### Drop-shipping

Where stock is always available from suppliers:

```typescript
import { registerPhysicalWarehousing } from '@unchainedshop/core';

registerPhysicalWarehousing({
  adapterId: 'dropship',
  stock: 99999,
  commissioningTime: 3 * 24 * 60 * 60 * 1000,
});
```

## Extending for Real Inventory

For production use, pass inventory callbacks to `registerPhysicalWarehousing`:

```typescript
import { registerPhysicalWarehousing } from '@unchainedshop/core';

registerPhysicalWarehousing({
  adapterId: 'real-store',
  orderIndex: 0,
  stock: async (referenceDate, configuration, { product }) => {
    const sku = product?.warehousing?.sku;
    if (!sku) return 0;
    const inventory = await db.collection('inventory').findOne({ sku });
    return inventory?.quantity || 0;
  },
  productionTime: async (quantity, configuration, { product }) => {
    const sku = product?.warehousing?.sku;
    const supplier = await getSupplierLeadTime(sku);
    return supplier.leadTimeDays * 24 * 60 * 60 * 1000;
  },
  commissioningTime: 4 * 60 * 60 * 1000,
});
```

## Integration with Delivery

Warehousing time affects delivery estimates:

```typescript
// In delivery adapter
async estimatedDeliveryThroughput(warehousingTime) {
  // warehousingTime = productionTime + commissioningTime
  const shippingTime = 3 * 24 * 60 * 60 * 1000; // 3 days shipping
  return warehousingTime + shippingTime;
}
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

- [Plugins Overview](./) - All available plugins
- [ETH Minter](./warehousing-eth-minter.md) - Virtual/NFT inventory
- [Custom Warehousing Plugins](../../extend/order-fulfilment/fulfilment-plugins/warehousing.md) - Write your own
