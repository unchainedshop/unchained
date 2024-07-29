---
title: 'Warehousing Providers'
description: 'Customize warehousing'
---

## WarehousingAdapter

You can define a custom Warehousing adapter to simulate the stock availability. In order to define a warehousing adapter you should implement the 
[IWarehousingAdapter](https://docs.unchained.shop/types/types/warehousing.IWarehousingAdapter.html) and register it to the global warehousing director that implements the [IWarehousingDirector](https://docs.unchained.shop/types/types/warehousing.IWarehousingDirector.html) interface. 

A store can have multiple Warehousing adapters configured and all of them are executed ordered by there `orderIndex` value. Warehousing adapters with lower `orderIndex` are executed first.

Below is a simple warehousing adapter implementation that will always show a stock is always available for all products.

```typescript

import { WarehousingAdapter, WarehousingProviderType } from '@unchainedshop/core-warehousing';
import {
  IWarehousingAdapter,
  WarehousingError,
  WarehousingAdapterActions,
  WarehousingContext,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { Context } from '@unchainedshop/api';

const Store: IWarehousingAdapter = {
  key: 'shop.unchained.warehousing.store',
  version: '1.0.0',
  label: 'Store',
  orderIndex: 0,
  initialConfiguration = [{ key: 'name', value: 'Flagship Store' }],

  typeSupported: (type: WarehousingProviderType): boolean => {
    return type === WarehousingProviderType.PHYSICAL;
  },

  actions: (
    config: WarehousingConfiguration,
    context: WarehousingContext & Context,
  ): WarehousingAdapterActions => {
    return {
      isActive: async (): boolean => {
        return true;
      },

      configurationError: async (): WarehousingError => {
        return null;
      },

      stock: async (referenceDate: Date): Promise<number> => {
        return 99999;
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

- **typeSupported(type: [WarehousingProviderType](https://docs.unchained.shop/types/enums/warehousing.WarehousingProviderType.html))**: Defines the warehousing provider type an adapter is valid for.
- **isActive**: Defines if the adapter is valid or not based any conditions you set.
- **configurationError(): [WarehousingError](https://docs.unchained.shop/types/enums/warehousing.WarehousingError.html)**: Any error that occurred during the initialization of an adapter. it can be a missing env or any value missing for a proper functioning of the adapter.
- **stock(referenceDate: Date)**: It should return the available stock of a product for the provided reference date. in the example above we are simply returning `99999` as stock count.
- **productionTime(quantityToProduct: number)**: Returns an estimate to produce number of product passed as an argument.
- **commissioningTime(quantity: number)**: number of days required to product a quantity passed as an argument 



## Register warehousing adapter

```typescript
import { WarehousingDirector } from '@unchainedshop/core-warehousing';

WarehousingDirector.registerAdapter(Store);
```