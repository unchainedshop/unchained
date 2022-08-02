---
title: "Filter plugins"
description: Customize filter 
---
Filter plugins are useful when you want to have a tailored filter functionality based on some requirements. you can have more than one FilterAdapter implementations and all of them will be executed sequentially based on there `orderIndex` index. Filter adapter with lower `orderIndex` will be first on the execution order and any modifications made on the previous Filter adapter will be available to filter that are executed after it. This is useful when you want to modularize your business logic.

When creating a filter make sure you don't use the same key for different filters.

To implement a custom filter plugin you need to implement [IFilterAdapter](https://docs.unchained.shop/types/types/filters.IFilterAdapter.html)
and register it on the [FilterDirector](https://docs.unchained.shop/types/types/filters.IFilterDirector.html)


Below is a simple filter plugin that will filter products based on there attribute values.

```typescript

import type { IFilterAdapter, FilterAdapterActions, FilterContext } from '@unchainedshop/types/filters';
import { Query, FindOptions } from '@unchainedshop/types/common';
import { Context } from '@unchainedshop/types/api';

const ShopAttributeFilter: IFilterAdapter = {
  key: 'ch.shop.filter',
  label: 'Filters products by metadata attributes',
  version: '0.1',
  orderIndex: 10,

  actions: (params: FilterContext & Context): FilterAdapterActions => {
    return {
      aggregateProductIds(params: { productIds: Array<string> }) {
        return productIds;
      },
      searchAssortments(
        params: {
          assortmentIds: Array<string>;
        },
        options?: {
          filterSelector: Query;
          assortmentSelector: Query;
          sortStage: FindOptions['sort'];
        },
      ) {
        return assortmentIds;
      },
      searchProducts(
        params: {
          productIds: Array<string>;
        },
        options?: {
          filterSelector: Query;
          productSelector: Query;
          sortStage: FindOptions['sort'];
        },
      ) {
        return productIds;
      },
      transformProductSelector(
        query: Query,
        options?: { key?: string; value?: any },
      ) {
        return {...query, inStock: true};
      },
      async transformSortStage(
        sort: FindOptions['sort'],
        options?: { key: string; value?: any },
      ) {
        return {...sort, created: -1 };
      },
      async transformFilterSelector(
        query: Query,
        options?: any,
      ): Promise<Query> {
        if (!last || Object.keys(last).length === 0) {
          return null;
        }
        return last;
      },

      async transformProductSelector(
        query: Query,
        options?: { key?: string; value?: any },
      ): Promise<Query> {
        if (!key) return last;
        return {
          status: 'ACTIVE',
          'shop.attributes': {
            $elemMatch: {
              key,
              value: value !== undefined ? value : { $exists: true },
            },
          },
        };
      },
    };
  },
};


```

### Breakdown
Lets look into each `field` & `function` defined by `IFilterAdapter` and what the function of each.
- `key`: Unique identification of adapter, identical to ID.
- `label`: Human readable label of the filter.
- `version`
- `orderIndex`: defines the execution order of a particular filter adapter. filter lower value will be executed first

- `transformProductSelector`: modifies selectors that are going to be used to filter products list. it gets filters that are added by filter adapters with lowe `orderIndex` as it's argument and is expected to return valid mongodb selector expression.
On the above example we are adding `status: 'ACTIVE'` selector if there is any filter configuration key provided on the filter and also expect the attribute value to match the configuration key: value.
Note: filters with higher `orderIndex` will get this value as there argument
  default value: `{ status: { '$in': [ 'ACTIVE', null ] } }`
- `transformFilterSelector`: modifies selectors that are going to be used to filter products list. it gets filters that are added by filter adapters with lowe `orderIndex` as it's argument and is expected to return valid mongodb selector expression.
- `transformSortStage`: Used to modify sort options that to be applied for a filter. default sort option used is `{ index: 1 }` which is assigned by mongodb but can be changed to use any field on a collection.
in the we are adding a sort `{created: -1}` to the previous sort option and filter adapter with higher `orderIndex` will get this value as there parameter.

  default value:  `{ _id: { '$in': [] }, isActive: true }`

- `searchAssortments`: Triggered when searching for assortments, It is required to return array of assortment Ids that pass the filter checks or empty array if none is found. it gets `assortmentIds` that have been matched so far by filters that run before the particular filter.
- `searchProducts`: Triggered when searching for products, It is required to return array of product Ids that pass the filter checks or empty array if none is found. it gets `productIds` that have been matched so far by filters that run before the particular filter.
- `aggregateProductIds`: Executed when searching products, it holds array of the final matching productIds found so far. It is required to return array of product ids.



### Order of execution

1. `transformFilterSelector`
2. `transformProductSelector` if current operation is search product, else, skip to step 3
3. `transformSortStage`
4. `searchProducts` or `searchAssortments` depending on the operation. i.e when searching for products or searching for assortments.
5. `aggregateProductIds` if current operation is search product



### Final Step

In order to make use of the filter we need to register it on the FilterDirector.


```typescript

import { FilterDirector } from '@unchainedshop/core-filters';
...
FilterDirector.registerAdapter(ShopAttributeFilter);

```


### Shorthand

Incase you only want to change implementation of only few functions and keep the other default implementation, you can do so by importing `FilterAdapter` from `@unchainedshop/core-filters` and override the that specific functions implementation. 

Below is a simplified implementation of the `ShopAttributeFilter` above, this time it will use the default implantation and override `transformProductSelector` function only.

```typescript
import { FilterAdapter, FilterDirector } from '@unchainedshop/core-filters';
import type { IFilterAdapter } from '@unchainedshop/types/filters';

const ShopAttributeFilter: IFilterAdapter = {
  ...FilterAdapter,
  key: 'ch.shop.filter',
  label: 'Filters products by metadata attributes',
  version: '0.1',
  orderIndex: 10,

  actions: (params: FilterContext & Context): FilterAdapterActions => {
    return {
      ...FilterAdapter.actions(params),
      async transformProductSelector(query: Query, options?: { key?: string; value?: any }): Promise<Query> {
        if (!key) return last;
        return {
          status: 'ACTIVE',
          'shop.attributes': {
            $elemMatch: {
              key,
              value: value !== undefined ? value : { $exists: true },
            },
          },
        };
      },
    }
  }

}

FilterDirector.registerAdapter(ShopAttributeFilter);

```

