---
title: "Filter"
description: Customize filter and search
---

Filter plugins are useful when you want to have a tailored filter functionality based on some requirements. you can have more than one FilterAdapter implementations and all of them will be executed sequentially based on there `orderIndex` index. Filter adapter with lower `orderIndex` will be first on the execution order and any modifications made on the previous Filter adapter will be available to filter that are executed after it. This is useful when you want to modularize your business logic.

When creating a filter make sure you don't use the same key for different filters.

To implement a custom filter plugin you need to implement [IFilterAdapter](https://docs.unchained.shop/types/types/filters.IFilterAdapter.html)
and register it on the [FilterDirector](https://docs.unchained.shop/types/types/filters.IFilterDirector.html)


Below is a simple filter plugin that will filter products based on there attribute values.

```typescript

import type { IFilterAdapter, FilterAdapterActions, FilterContext } from '@unchainedshop/core-filters';
import { Context } from '@unchainedshop/api';

const ShopAttributeFilter: IFilterAdapter = {
  key: 'ch.shop.filter',
  label: 'Filters products by metadata attributes',
  version: '1.0.0',
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
          filterSelector: Filter;
          assortmentSelector: Filter;
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
- `orderIndex`: defines the execution order of a particular filter adapter. filter adapters lower value will be executed first

- `transformProductSelector`: modifies selectors that are going to be used to filter products list. it gets filters that are added by filter adapters with lowe `orderIndex` as it's argument and is expected to return valid mongodb selector expression.
In the above example we are adding `status: 'ACTIVE'` selector if there is any filter configuration key provided on the filter, also expect the attribute value to match the configuration key: value.
Note: filters with higher `orderIndex` will get this value as there argument
  default value: `{ status: { '$in': [ 'ACTIVE', null ] } }`
- `transformFilterSelector`: This transform fn allows you to customize the selector that returns the filters that should show up for a given search query. By default it uses the assortment's filter links to return those filters. Sometimes there is no assortment scope (global search for products) or you want to make a specific filter appear just everywhere. In those cases this can be helpful by returning additional filters through the selector.
- `transformSortStage`: Used to modify sort options that will to be applied for filter. default sort option value is `{ index: 1 }` which is for mongodb automatically assigned index value, but it can be changed to use any field in a collection.
in the example above we are adding a sort `{ created: -1 }` to the previous sort option and filter adapters with higher `orderIndex` will get this value as there parameter.

  default value:  `{ _id: { '$in': [] }, isActive: true }`

- `searchAssortments`: Triggered when searching for assortments, It is required to return array of assortment Ids that pass the filter checks or empty array if none is found. it gets `assortmentIds` that have been matched so far by filters with lower `orderIndex`.
- `searchProducts`: Triggered when searching for products, It is required to return array of product Ids that pass the filter checks or empty array if none is found. it gets `productIds` that have been matched so far by filters with lower `orderIndex`.
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
import type { IFilterAdapter, FilterAdapterActions, FilterContext } from '@unchainedshop/core-filters';
import { Context } from '@unchainedshop/api';

const ShopAttributeFilter: IFilterAdapter = {
  ...FilterAdapter,
  key: 'ch.shop.filter',
  label: 'Filters products by metadata attributes',
  version: '1.0.0',
  orderIndex: 10,

  actions: (params: FilterContext & Context): FilterAdapterActions => {
    return {
      ...FilterAdapter.actions(params),
      async transformProductSelector(query, options) {
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

