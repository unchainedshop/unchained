---
sidebar_position: 10
sidebar_label: Warehousing
title: Write a Warehousing Provider Plugin
description: Customize warehousing
---

# Warehousing Provider Plugins

A warehousing adapter models stock availability and fulfilment timing. A store can have several; they run in ascending `orderIndex`.

| Factory | For |
|---|---|
| [`registerPhysicalWarehousing`](../../plugin-factories.md#warehousing) | physical goods (stock / production / commissioning time) |
| [`registerVirtualWarehousing`](../../plugin-factories.md#warehousing) | tokenized / NFT products (`tokenize`) |

## Example: physical store stock

```typescript
import { registerPhysicalWarehousing } from '@unchainedshop/core';

registerPhysicalWarehousing({
  adapterId: 'flagship-store',
  stock: async (referenceDate, configuration, context) => 99999,
  productionTime: 0,      // ms; made-to-order lead time
  commissioningTime: 0,   // ms to prepare for shipping
});
```

Each option accepts either a literal value or a `(…args, configuration, context) => Promise<number>` callback.

| Option | Description |
|---|---|
| `stock` | available quantity at a reference date |
| `productionTime` | ms to produce a quantity (made-to-order) |
| `commissioningTime` | ms to prepare a quantity for shipping |
| `orderIndex` | execution order (default `0`) |

## Example: tokenized products

```typescript
import { registerVirtualWarehousing } from '@unchainedshop/core';

registerVirtualWarehousing({
  adapterId: 'nft-minter',
  tokenize: async (configuration, context) => {
    // return the token surrogates to mint for the checked-out position
    return [{
      _id: crypto.randomUUID(),
      quantity: 1,
      contractAddress: '0x…',
      tokenSerialNumber: '1',
      meta: {},
    }];
  },
});
```

> For full control of every `IWarehousingAdapter` method, build the adapter directly and register it via `pluginRegistry.register()` — see [Plugin System](../../../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Plugin Factories](../../plugin-factories.md#warehousing) — the warehousing factories
- [Warehousing plugins](../../../plugins/warehousing/warehousing-store) — shipped adapters
