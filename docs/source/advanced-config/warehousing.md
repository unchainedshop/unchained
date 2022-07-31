---
title: 'Warehousing Plugin'
description: 'Customize warehousing'
---

```typescript

import {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import type { IWarehousingAdapter, WarehousingConfiguration, WarehousingContext, WarehousingAdapterActions, WarehousingError } from '@unchainedshop/types/warehousing';
import { ProductStatus } from '@unchainedshop/core-products';

const ShopWarehouse: IWarehousingAdapter = {
  ...WarehousingAdapter,

  key: 'ch.Shop.unchained.warehousing',
  version: '1.0',
  label: 'Shop Warehousing',
  orderIndex: 0,

  initialConfiguration: WarehousingConfiguration =  [{ key: 'address', value: null }],

  typeSupported: (type: WarehousingProviderType): boolean => {
    return type === WarehousingProviderType.PHYSICAL;
  },

  actions: (config: WarehousingConfiguration,
    context: WarehousingContext & Context): WarehousingAdapterActions => {
    const { product, referenceDate } = context;

    return {
      isActive: (): boolean => {
        return true;
      },

      configurationError: (): WarehousingError => {
        return null;
      },

      stock: async (referenceDate: Date): Promise<number> => {
        const sku = product.warehousing && product.warehousing.sku;
        if (product.status !== ProductStatus.ACTIVE) return undefined;
        if (!sku) return undefined;
        // return available stock
        return 300
      },

      productionTime: async (quantityToProduce: number): Promise<number> => {
        return 0;
      },

      commissioningTime: async (quantity: number): Promise<number> => {
        return 0;
      },
    };
  },
};

```


```typescript
WarehousingDirector.registerAdapter(ShopWarehouse);
```