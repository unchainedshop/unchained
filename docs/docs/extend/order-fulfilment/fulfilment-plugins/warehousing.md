---
sidebar_position: 10
sidebar_label: Warehousing
title: Write a Warehousing Provider Plugin
description: Customize warehousing
---

# Warehousing Provider Plugins

Warehousing adapters provide stock and lead-time information for configured warehousing providers. Import adapters and directors from `@unchainedshop/core`, and provider data types from `@unchainedshop/core-warehousing`.

## Creating an Adapter

```typescript
import { WarehousingAdapter, WarehousingDirector, type IWarehousingAdapter } from '@unchainedshop/core';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';

const AlwaysAvailable: IWarehousingAdapter = {
  ...WarehousingAdapter,
  key: 'my-shop.warehousing.always-available',
  version: '1.0.0',
  label: 'Always available',
  orderIndex: 0,
  initialConfiguration: [{ key: 'name', value: 'Flagship Store' }],

  typeSupported: (type) => type === WarehousingProviderType.PHYSICAL,

  actions(config, context) {
    return {
      ...WarehousingAdapter.actions(config, context),
      isActive: () => true,
      configurationError: () => null,
      stock: async () => 99999,
      productionTime: async () => 0,
      commissioningTime: async () => 0,
    };
  },
};

WarehousingDirector.registerAdapter(AlwaysAvailable);
```

The example simulates availability; it does not track or decrement physical stock. Import it before startup and select its adapter key when creating a warehousing provider.

## Actions

| Action | Purpose |
|--------|---------|
| `typeSupported(type)` | Selects supported provider types |
| `isActive()` | Indicates whether this configured provider is usable |
| `configurationError()` | Returns a configuration error or `null` |
| `stock(referenceDate)` | Returns available quantity for the requested date |
| `productionTime(quantityToProduce)` | Estimates production time in milliseconds |
| `commissioningTime(quantity)` | Estimates preparation time in milliseconds |
| `tokenize()` | Creates token surrogates for tokenized products |
| `tokenMetadata(serialNumber, referenceDate)` | Resolves token metadata |
| `isInvalidateable(serialNumber, referenceDate)` | Controls token invalidation |

`isActive` and `configurationError` are synchronous; stock, timing, and token actions return promises. Spread the base actions to retain defaults for methods you do not override.
