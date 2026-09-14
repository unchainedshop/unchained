---
sidebar_position: 2
title: Store Warehousing
sidebar_label: Store
description: Physical inventory management adapter
---

# Store Warehousing Adapter

The Store adapter reports a fixed stock quantity for physical products. It does not track purchases or decrement inventory.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/warehousing/store.js';
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

- Physical-product availability
- Fixed stock of 99999 units
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
Returns `99999` for every product and reference date. This is a fixed placeholder quantity, not measured inventory.

### `productionTime()`
Returns `0` - no production delay.

### `commissioningTime()`
Returns `0` - no preparation delay.

## Use Cases

### Development & Testing

Use the Store adapter during development when you don't need real inventory tracking:

```typescript
import '@unchainedshop/plugins/warehousing/store.js';
```

### Simple Stores

For small shops where inventory is managed manually outside the system.

## Connecting Inventory

Use a custom adapter with an application-provided inventory lookup. Start with the `WarehousingAdapter` defaults so all required actions are present:

```typescript
import { WarehousingAdapter, WarehousingDirector, type IWarehousingAdapter } from '@unchainedshop/core';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';

function registerInventory(stockForSku: (sku: string, referenceDate: Date) => Promise<number>) {
  const adapter: IWarehousingAdapter = {
    ...WarehousingAdapter,
    key: 'my-shop.inventory',
    label: 'Inventory Service',
    version: '1.0.0',
    typeSupported: (type) => type === WarehousingProviderType.PHYSICAL,
    actions(config, context) {
      return {
        ...WarehousingAdapter.actions(config, context),
        configurationError: () => null,
        isActive: () => true,
        stock: async (referenceDate) => {
          const sku = context.product?.warehousing?.sku;
          return sku ? stockForSku(sku, referenceDate) : 0;
        },
        commissioningTime: async () => 4 * 60 * 60 * 1000,
      };
    },
  };
  WarehousingDirector.registerAdapter(adapter);
}
```

Call `registerInventory` with your inventory-system lookup. The stock plugin's context contains the product and order context; it does not expose a `modules.warehousing.findWarehouse` API. Keep persistence and external inventory operations in your own module or service.

Production and commissioning times are measured in milliseconds. Delivery adapters receive the combined warehousing time through their asynchronous `estimatedDeliveryThroughput(warehousingTime)` action.

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
